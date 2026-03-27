import {
  getResponseRedirectLocation,
  isRouteRedirect,
  RSC_MIDDLEWARE_REDIRECT_HEADER,
  RSC_MIDDLEWARE_STATUS_HEADER,
  runRouteMiddleware
} from '@/framework/middleware.ts'
import { resolveRoute } from '@/router.tsx'
import type { MatchedRoute, RequestKind, RouteContext, RouteMiddlewareResult } from '@/router.tsx'

export async function runRequestMiddleware(args: {
  context?: RouteContext
  isRscRequest: boolean
  match: MatchedRoute | null
  request: Request
  requestKind: RequestKind
  url: URL
}) {
  const result = await runRouteMiddleware(args)

  return {
    context: result.context,
    response: createMiddlewareResponse(result.result, args.url, args.isRscRequest)
  }
}

function createMiddlewareResponse(
  result: Exclude<RouteMiddlewareResult, void> | undefined,
  url: URL,
  isRscRequest: boolean
) {
  if (!result) {
    return null
  }

  if (isRouteRedirect(result)) {
    return createRedirectResponse(result.location, result.status ?? 302, url, isRscRequest)
  }

  const responseRedirectLocation = getResponseRedirectLocation(result)
  if (responseRedirectLocation && isRscRequest) {
    return createRscRedirectResponse(
      new URL(responseRedirectLocation, url).toString(),
      result.status
    )
  }

  return result
}

function createRedirectResponse(location: string, status: number, url: URL, isRscRequest: boolean) {
  const resolvedLocation = new URL(location, url).toString()

  return isRscRequest
    ? createRscRedirectResponse(resolvedLocation, status)
    : Response.redirect(resolvedLocation, status)
}

function createRscRedirectResponse(location: string, status: number) {
  return new Response(null, {
    status: 204,
    headers: {
      [RSC_MIDDLEWARE_REDIRECT_HEADER]: location,
      [RSC_MIDDLEWARE_STATUS_HEADER]: String(status)
    }
  })
}

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest

  describe('runRequestMiddleware', () => {
    it('redirects protected SSR requests before page rendering', async () => {
      const url = new URL('https://example.com/protected')
      const response = (
        await runRequestMiddleware({
          isRscRequest: false,
          match: resolveRoute(url),
          request: new Request(url),
          requestKind: 'ssr',
          url
        })
      ).response

      expect(response?.status).toBe(302)
      expect(response?.headers.get('location')).toBe('https://example.com/login?next=%2Fprotected')
    })

    it('returns an explicit redirect signal for protected RSC navigations', async () => {
      const url = new URL('https://example.com/protected')
      const response = (
        await runRequestMiddleware({
          isRscRequest: true,
          match: resolveRoute(url),
          request: new Request(url),
          requestKind: 'rsc',
          url
        })
      ).response

      expect(response?.status).toBe(204)
      expect(response?.headers.get(RSC_MIDDLEWARE_REDIRECT_HEADER)).toBe(
        'https://example.com/login?next=%2Fprotected'
      )
    })

    it('blocks hydrated server actions before action execution', async () => {
      const url = new URL('https://example.com/protected')
      const response = (
        await runRequestMiddleware({
          isRscRequest: true,
          match: resolveRoute(url),
          request: new Request(url, {
            body: '',
            headers: {
              'content-type': 'text/plain;charset=utf-8',
              'x-rsc-action': 'invalid-action-id'
            },
            method: 'POST'
          }),
          requestKind: 'action',
          url
        })
      ).response

      expect(response?.status).toBe(204)
      expect(response?.headers.get(RSC_MIDDLEWARE_REDIRECT_HEADER)).toBe(
        'https://example.com/login?next=%2Fprotected'
      )
    })

    it('blocks progressive-enhancement form posts before action decoding', async () => {
      const url = new URL('https://example.com/protected')
      const formData = new FormData()
      formData.set('note', 'blocked')

      const response = (
        await runRequestMiddleware({
          isRscRequest: false,
          match: resolveRoute(url),
          request: new Request(url, {
            body: formData,
            method: 'POST'
          }),
          requestKind: 'action',
          url
        })
      ).response

      expect(response?.status).toBe(303)
      expect(response?.headers.get('location')).toBe('https://example.com/login?next=%2Fprotected')
    })
  })
}
