import { defineHandler } from 'void'
import { DEMO_AUTH_COOKIE_NAME, getCookieValue, hasDemoAuthCookie } from '@server/lib/demo-auth.ts'

export const GET = defineHandler((c) => {
  const authCookie = getCookieValue(c.req.raw.headers.get('cookie'), DEMO_AUTH_COOKIE_NAME)

  return Response.json({
    authenticated: hasDemoAuthCookie(authCookie),
    kind: 'api',
    method: c.req.method,
    pathname: c.req.path,
    timestamp: new Date().toISOString()
  })
})
