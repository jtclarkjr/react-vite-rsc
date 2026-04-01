const ACTION_ROUTE_PREFIX = '/_actions/'
const RSC_ROUTE_PREFIX = '/_rsc'

type RenderRequest = {
  actionId?: string
  isAction: boolean
  isRsc: boolean
  request: Request
  url: URL
}

export function createRscRenderRequest(urlString: string): Request {
  const url = new URL(urlString)
  url.pathname = toRscPath(url.pathname)

  return new Request(url.toString(), {
    method: 'GET'
  })
}

export function createServerActionRequest(
  urlString: string,
  action: { id: string; body: BodyInit }
): Request {
  const url = new URL(urlString)
  url.pathname = `${ACTION_ROUTE_PREFIX}${encodeURIComponent(action.id)}`
  url.search = ''
  url.searchParams.set('url', toAppHref(new URL(urlString)))

  return new Request(url.toString(), {
    method: 'POST',
    body: action.body
  })
}

export function parseRenderRequest(request: Request): RenderRequest {
  const url = new URL(request.url)
  const isAction = request.method === 'POST'

  if (isRscPath(url.pathname)) {
    url.pathname = toAppPathFromRscPath(url.pathname)
    return {
      isRsc: true,
      isAction,
      request: new Request(url, request),
      url
    }
  }

  const actionId = parseActionId(url.pathname)
  if (actionId) {
    const target = url.searchParams.get('url')
    if (!target) {
      throw new Error('Missing app url for internal server action request')
    }

    const appUrl = new URL(target, url)
    return {
      actionId,
      isRsc: true,
      isAction: true,
      request: new Request(appUrl, request),
      url: appUrl
    }
  }

  return {
    isRsc: false,
    isAction,
    request,
    url
  }
}

function isRscPath(pathname: string) {
  return pathname === RSC_ROUTE_PREFIX || pathname.startsWith(`${RSC_ROUTE_PREFIX}/`)
}

function parseActionId(pathname: string) {
  if (!pathname.startsWith(ACTION_ROUTE_PREFIX)) {
    return undefined
  }

  const encodedActionId = pathname.slice(ACTION_ROUTE_PREFIX.length)
  return encodedActionId ? decodeURIComponent(encodedActionId) : undefined
}

function toAppHref(url: URL) {
  return `${url.pathname}${url.search}`
}

function toAppPathFromRscPath(pathname: string) {
  const appPath = pathname.slice(RSC_ROUTE_PREFIX.length)
  return appPath || '/'
}

function toRscPath(pathname: string) {
  return pathname === '/' ? RSC_ROUTE_PREFIX : `${RSC_ROUTE_PREFIX}${pathname}`
}

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest

  describe('createRscRenderRequest', () => {
    it('builds a Nitro RSC endpoint from the current page URL', () => {
      const request = createRscRenderRequest('https://example.com/blog/example-slug?draft=1')

      expect(request.method).toBe('GET')
      expect(request.url).toBe('https://example.com/_rsc/blog/example-slug?draft=1')
    })

    it('maps the root route to the RSC endpoint root', () => {
      const request = createRscRenderRequest('https://example.com/')

      expect(request.url).toBe('https://example.com/_rsc')
    })
  })

  describe('createServerActionRequest', () => {
    it('builds a dedicated Nitro action endpoint', () => {
      const request = createServerActionRequest('https://example.com/blog/example-slug?draft=1', {
        id: 'action-123',
        body: '[]'
      })

      expect(request.method).toBe('POST')
      expect(request.url).toBe(
        'https://example.com/_actions/action-123?url=%2Fblog%2Fexample-slug%3Fdraft%3D1'
      )
    })
  })

  describe('parseRenderRequest', () => {
    it('normalizes Nitro RSC URLs back to the app URL', () => {
      const request = new Request('https://example.com/_rsc/blog/example-slug?draft=1')
      const parsed = parseRenderRequest(request)

      expect(parsed).toMatchObject({
        isAction: false,
        isRsc: true
      })
      expect(parsed.url.pathname).toBe('/blog/example-slug')
      expect(parsed.url.search).toBe('?draft=1')
    })

    it('normalizes Nitro action URLs back to the app URL', () => {
      const request = new Request(
        'https://example.com/_actions/action-123?url=%2Fblog%2Fexample-slug%3Fdraft%3D1',
        {
          body: '[]',
          method: 'POST'
        }
      )
      const parsed = parseRenderRequest(request)

      expect(parsed).toMatchObject({
        actionId: 'action-123',
        isAction: true,
        isRsc: true
      })
      expect(parsed.url.pathname).toBe('/blog/example-slug')
      expect(parsed.url.search).toBe('?draft=1')
    })

    it('keeps progressive enhancement form posts on the document URL', () => {
      const formData = new FormData()
      formData.set('note', 'hello')
      const request = new Request('https://example.com/blog/example-slug?draft=1', {
        body: formData,
        method: 'POST'
      })
      const parsed = parseRenderRequest(request)

      expect(parsed).toMatchObject({
        isAction: true,
        isRsc: false
      })
      expect(parsed.url.pathname).toBe('/blog/example-slug')
      expect(parsed.url.search).toBe('?draft=1')
    })

    it('throws for internal action requests without a target page URL', () => {
      const request = new Request('https://example.com/_actions/action-123', {
        body: '[]',
        method: 'POST'
      })

      expect(() => parseRenderRequest(request)).toThrow(
        'Missing app url for internal server action request'
      )
    })
  })
}
