type LoggedRequestKind = 'api' | 'page'

export function classifyLoggedRequest(request: Request): LoggedRequestKind | null {
  const pathname = new URL(request.url).pathname
  if (pathname === '/api' || pathname.startsWith('/api/')) {
    return 'api'
  }

  if (
    pathname.startsWith('/_rsc') ||
    pathname.startsWith('/_actions') ||
    pathname.startsWith('/auth/')
  ) {
    return null
  }

  if (pathname.startsWith('/assets/') || pathname === '/vite.svg') {
    return null
  }

  if (/\.[a-z0-9]+$/i.test(pathname)) {
    return null
  }

  if (!isPageNavigationRequest(request)) {
    return null
  }

  return 'page'
}

function isPageNavigationRequest(request: Request) {
  const method = request.method.toUpperCase()
  if (method !== 'GET' && method !== 'HEAD' && method !== 'POST') {
    return false
  }

  const purpose = request.headers.get('purpose') ?? request.headers.get('sec-purpose')
  if (purpose?.toLowerCase().includes('prefetch')) {
    return false
  }

  const secFetchDest = request.headers.get('sec-fetch-dest')
  if (secFetchDest) {
    return secFetchDest === 'document' || secFetchDest === 'iframe' || secFetchDest === 'frame'
  }

  const accept = request.headers.get('accept') ?? ''
  return accept.includes('text/html')
}

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest

  describe('classifyLoggedRequest', () => {
    it('logs api requests regardless of accept header', () => {
      const request = new Request('https://example.com/api/demo/request')

      expect(classifyLoggedRequest(request)).toBe('api')
    })

    it('logs browser document navigations as page requests', () => {
      const request = new Request('https://example.com/dashboard', {
        headers: {
          accept: 'text/html,application/xhtml+xml',
          'sec-fetch-dest': 'document'
        }
      })

      expect(classifyLoggedRequest(request)).toBe('page')
    })

    it('skips non-html background requests to page routes', () => {
      const request = new Request('https://example.com/', {
        headers: {
          accept: '*/*'
        }
      })

      expect(classifyLoggedRequest(request)).toBeNull()
    })

    it('skips prefetch requests', () => {
      const request = new Request('https://example.com/', {
        headers: {
          accept: 'text/html',
          purpose: 'prefetch'
        }
      })

      expect(classifyLoggedRequest(request)).toBeNull()
    })
  })
}
