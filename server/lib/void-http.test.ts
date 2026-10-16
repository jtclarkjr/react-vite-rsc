import { describe, expect, it } from 'vitest'
import {
  createDemoAuthCookieHeader,
  createExpiredDemoAuthCookieHeader,
  getCookieValue,
  getPageAuthRedirect,
  sanitizeRedirectTarget
} from './demo-auth.ts'
import { classifyLoggedRequest } from './request-logger.ts'
import { shouldForwardRscRequest } from './void-rsc.ts'

const origin = 'https://example.com'

function documentRequest(pathname: string, init: RequestInit = {}) {
  return new Request(origin + pathname, { headers: { accept: 'text/html' }, ...init })
}

describe('Void render routing', () => {
  it('forwards Flight endpoints and dotted action IDs before asset fallback', () => {
    expect(shouldForwardRscRequest(new Request(origin + '/_rsc/blog/release.1'))).toBe(true)
    expect(shouldForwardRscRequest(new Request(origin + '/_rsc', { method: 'HEAD' }))).toBe(true)
    expect(
      shouldForwardRscRequest(
        new Request(origin + '/_actions/src%2Froutes%2Fpage.tsx%23save?url=%2Fdashboard', {
          method: 'POST',
          body: '[]'
        })
      )
    ).toBe(true)
  })

  it('forwards document navigations and progressive forms, including dotted slugs', () => {
    expect(shouldForwardRscRequest(documentRequest('/blog/release.1'))).toBe(true)
    expect(shouldForwardRscRequest(documentRequest('/blog/release.1', { method: 'POST' }))).toBe(
      true
    )
    expect(shouldForwardRscRequest(documentRequest('/dashboard', { method: 'HEAD' }))).toBe(true)
  })

  it.each([
    '/api/posts',
    '/auth/login',
    '/__void/health',
    '/@vite/client',
    '/@id/virtual:module',
    '/@fs/tmp/module.ts',
    '/__vite_ping',
    '/src/main.client.ts',
    '/node_modules/react/index.js',
    '/assets/main.js',
    '/vite.svg'
  ])('keeps %s outside the document renderer', (pathname) => {
    expect(shouldForwardRscRequest(documentRequest(pathname))).toBe(false)
  })

  it('does not turn background requests or unsupported internal methods into documents', () => {
    expect(shouldForwardRscRequest(new Request(origin + '/blog/release.1'))).toBe(false)
    expect(shouldForwardRscRequest(documentRequest('/_rsc', { method: 'DELETE' }))).toBe(false)
    expect(shouldForwardRscRequest(documentRequest('/_actions/action'))).toBe(false)
    expect(
      shouldForwardRscRequest(
        documentRequest('/script.js', {
          headers: { accept: 'text/html', 'sec-fetch-dest': 'script' }
        })
      )
    ).toBe(false)
  })
})

describe('demo page auth', () => {
  it.each(['/dashboard?draft=1', '/_rsc/dashboard?draft=1'])(
    'protects the normalized page target for %s',
    (pathname) => {
      expect(getPageAuthRedirect(new Request(origin + pathname))).toBe(
        '/login?redirect=%2Fdashboard%3Fdraft%3D1'
      )
    }
  )

  it('protects server actions by their target page', () => {
    const request = new Request(
      origin + '/_actions/src%2Froutes%2Fpage.tsx%23save?url=%2Fdashboard%3Ftab%3Dnotes',
      { method: 'POST', body: '[]' }
    )
    expect(getPageAuthRedirect(request)).toBe('/login?redirect=%2Fdashboard%3Ftab%3Dnotes')
  })

  it('allows demo cookies and public page targets', () => {
    expect(
      getPageAuthRedirect(
        new Request(origin + '/_rsc/dashboard', { headers: { cookie: 'demo-auth=1' } })
      )
    ).toBeUndefined()
    expect(getPageAuthRedirect(new Request(origin + '/_rsc/login'))).toBeUndefined()
    expect(getPageAuthRedirect(new Request(origin + '/dashboard-extra'))).toBeUndefined()
  })

  it('treats malformed cookies as unauthenticated', () => {
    expect(getCookieValue('demo-auth=%ZZ', 'demo-auth')).toBeUndefined()
    expect(
      getPageAuthRedirect(
        new Request(origin + '/dashboard', { headers: { cookie: 'demo-auth=%ZZ' } })
      )
    ).toBe('/login?redirect=%2Fdashboard')
  })

  it('retains the demo cookie contract and rejects external redirect targets', () => {
    expect(createDemoAuthCookieHeader()).toBe(
      'demo-auth=1; Path=/; HttpOnly; Max-Age=3600; SameSite=Lax'
    )
    expect(createExpiredDemoAuthCookieHeader()).toBe(
      'demo-auth=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax'
    )
    expect(sanitizeRedirectTarget('/blog/release.1?tab=notes')).toBe('/blog/release.1?tab=notes')
    for (const target of [null, 'https://other.example', '//other.example', '/\\other.example']) {
      expect(sanitizeRedirectTarget(target)).toBe('/dashboard')
    }
  })
})

describe('request logging', () => {
  it('logs API responses and HTML documents, including dotted slugs', () => {
    expect(classifyLoggedRequest(new Request(origin + '/api/demo/request'))).toBe('api')
    expect(classifyLoggedRequest(documentRequest('/blog/release.1'))).toBe('page')
  })

  it('skips Flight requests, prefetches, background fetches, auth and assets', () => {
    for (const pathname of [
      '/_rsc/dashboard',
      '/_actions/action',
      '/auth/login',
      '/assets/main.js'
    ]) {
      expect(classifyLoggedRequest(documentRequest(pathname))).toBeNull()
    }
    expect(classifyLoggedRequest(new Request(origin + '/dashboard'))).toBeNull()
    expect(
      classifyLoggedRequest(
        documentRequest('/dashboard', { headers: { accept: 'text/html', purpose: 'prefetch' } })
      )
    ).toBeNull()
  })
})
