import { defineHandler } from 'nitro'
import { DEMO_AUTH_COOKIE_NAME, getCookieValue, hasDemoAuthCookie } from '@server/lib/demo-auth.ts'

export default defineHandler((event) => {
  const authCookie = getCookieValue(event.req.headers.get('cookie'), DEMO_AUTH_COOKIE_NAME)

  return Response.json({
    authenticated: hasDemoAuthCookie(authCookie),
    kind: 'api',
    method: event.req.method,
    pathname: event.url.pathname,
    timestamp: new Date().toISOString()
  })
})
