import type {
  MatchedRoute,
  RouteContext,
  RouteRedirect,
  RouteMiddlewareResult,
  RequestKind
} from '@/router.tsx'

export const RSC_MIDDLEWARE_REDIRECT_HEADER = 'x-route-middleware-redirect'
export const RSC_MIDDLEWARE_STATUS_HEADER = 'x-route-middleware-status'

export function redirect(location: string, status: RouteRedirect['status'] = 302): RouteRedirect {
  return {
    type: 'redirect',
    location,
    status
  }
}

export function isRouteRedirect(
  result: RouteMiddlewareResult | undefined
): result is RouteRedirect {
  return result?.type === 'redirect'
}

export async function runRouteMiddleware(args: {
  context?: RouteContext
  match: MatchedRoute | null
  request: Request
  requestKind: RequestKind
  url: URL
}): Promise<{ context: RouteContext; result?: Exclude<RouteMiddlewareResult, void> }> {
  const context = args.context ?? {}
  const match = args.match
  const middleware = match?.module.middleware

  if (!middleware) {
    return { context }
  }

  for (const run of middleware) {
    const result = await run({
      context,
      params: match.params,
      request: args.request,
      requestKind: args.requestKind,
      url: args.url
    })

    if (result) {
      return { context, result }
    }
  }

  return { context }
}

export function getResponseRedirectLocation(response: Response) {
  if (!isRedirectStatus(response.status)) {
    return null
  }

  return response.headers.get('location')
}

function isRedirectStatus(status: number) {
  return [301, 302, 303, 307, 308].includes(status)
}

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest

  describe('runRouteMiddleware', () => {
    it('runs middleware in declaration order and shares context', async () => {
      const events: string[] = []
      const match: MatchedRoute = {
        module: {
          default: () => null,
          middleware: [
            ({ context }) => {
              events.push('first')
              context.user = 'Casey'
            },
            ({ context }) => {
              events.push(`second:${String(context.user)}`)
              context.greeting = `Hi ${String(context.user)}`
            }
          ]
        },
        params: {}
      }

      const result = await runRouteMiddleware({
        match,
        request: new Request('https://example.com/protected'),
        requestKind: 'ssr',
        url: new URL('https://example.com/protected')
      })

      expect(events).toEqual(['first', 'second:Casey'])
      expect(result.context).toEqual({
        greeting: 'Hi Casey',
        user: 'Casey'
      })
      expect(result.result).toBeUndefined()
    })

    it('skips middleware execution when no route matched', async () => {
      const result = await runRouteMiddleware({
        match: null,
        request: new Request('https://example.com/missing'),
        requestKind: 'ssr',
        url: new URL('https://example.com/missing')
      })

      expect(result.context).toEqual({})
      expect(result.result).toBeUndefined()
    })
  })
}
