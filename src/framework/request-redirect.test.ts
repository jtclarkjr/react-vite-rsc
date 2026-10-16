// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { fetchRenderResponse } from './request.tsx'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('fetchRenderResponse', () => {
  it('passes an RSC response through for decoding', async () => {
    const response = new Response('flight', {
      headers: { 'content-type': 'text/x-component' }
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

    expect(await fetchRenderResponse(new Request('https://example.com/_rsc'))).toBe(response)
  })

  it('navigates to a followed login redirect instead of decoding HTML as Flight', async () => {
    const response = new Response('<html>Login</html>')
    Object.defineProperties(response, {
      redirected: { value: true },
      url: { value: 'https://example.com/login?redirect=%2Fdashboard' }
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
    const navigate = vi.spyOn(window.location, 'assign').mockImplementation(() => {})

    expect(await fetchRenderResponse(new Request('https://example.com/_rsc/dashboard'))).toBeNull()
    expect(navigate).toHaveBeenCalledWith(response.url)
    expect(response.body?.locked).toBe(false)
  })
})
