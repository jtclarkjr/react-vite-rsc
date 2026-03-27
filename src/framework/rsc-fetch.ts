import { createRscRenderRequest } from '@/framework/request.tsx'
import { RSC_MIDDLEWARE_REDIRECT_HEADER } from '@/framework/middleware.ts'

export type FetchRscPayloadResult<T> = {
  payload: T
  redirected: boolean
}

export async function fetchRscPayloadWithRedirects<T>(args: {
  decode: (response: Promise<Response>) => Promise<T>
  fetcher?: (request: Request) => Promise<Response>
  maxRedirects?: number
  onRedirect: (location: string) => void
  request: Request
}): Promise<FetchRscPayloadResult<T>> {
  return await fetchRscPayloadWithRedirectsInternal({
    decode: args.decode,
    fetcher: args.fetcher ?? defaultFetch,
    maxRedirects: args.maxRedirects ?? 10,
    onRedirect: args.onRedirect,
    redirected: false,
    request: args.request
  })
}

async function fetchRscPayloadWithRedirectsInternal<T>(args: {
  decode: (response: Promise<Response>) => Promise<T>
  fetcher: (request: Request) => Promise<Response>
  maxRedirects: number
  onRedirect: (location: string) => void
  redirected: boolean
  request: Request
}): Promise<FetchRscPayloadResult<T>> {
  const response = await args.fetcher(args.request)
  const redirectLocation = response.headers.get(RSC_MIDDLEWARE_REDIRECT_HEADER)

  if (redirectLocation) {
    if (args.maxRedirects <= 0) {
      throw new Error(`Exceeded the middleware redirect limit for ${args.request.url}.`)
    }

    args.onRedirect(redirectLocation)

    return await fetchRscPayloadWithRedirectsInternal({
      ...args,
      maxRedirects: args.maxRedirects - 1,
      redirected: true,
      request: createRscRenderRequest(redirectLocation)
    })
  }

  assertRscResponse(response)

  return {
    payload: await args.decode(Promise.resolve(response)),
    redirected: args.redirected
  }
}

function assertRscResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.startsWith('text/x-component')) {
    throw new Error(
      `Expected an RSC response but received ${response.status} ${
        contentType || 'without an RSC content type'
      }.`
    )
  }
}

async function defaultFetch(request: Request) {
  return await fetch(request)
}

if (import.meta.vitest) {
  const { describe, expect, it, vi } = import.meta.vitest

  describe('fetchRscPayloadWithRedirects', () => {
    it('follows middleware redirects before decoding the RSC payload', async () => {
      const requests: string[] = []
      const onRedirect = vi.fn()
      const fetcher = vi.fn(async (request: Request) => {
        requests.push(request.url)

        if (request.url.endsWith('/protected_.rsc')) {
          return new Response(null, {
            status: 204,
            headers: {
              [RSC_MIDDLEWARE_REDIRECT_HEADER]: 'https://example.com/login?next=%2Fprotected'
            }
          })
        }

        return new Response('payload:login', {
          headers: {
            'content-type': 'text/x-component;charset=utf-8'
          }
        })
      })

      const result = await fetchRscPayloadWithRedirects({
        decode: async (response) => await (await response).text(),
        fetcher,
        onRedirect,
        request: createRscRenderRequest('https://example.com/protected')
      })

      expect(result).toEqual({
        payload: 'payload:login',
        redirected: true
      })
      expect(onRedirect).toHaveBeenCalledWith('https://example.com/login?next=%2Fprotected')
      expect(requests).toEqual([
        'https://example.com/protected_.rsc',
        'https://example.com/login_.rsc?next=%2Fprotected'
      ])
    })
  })
}
