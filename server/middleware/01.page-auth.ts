import { defineHandler } from 'nitro'
import {
  DEMO_AUTH_COOKIE_NAME,
  getCookieValue,
  hasDemoAuthCookie,
  isProtectedPagePath,
  LOGIN_ROUTE_PATH
} from '@server/lib/demo-auth.ts'

export default defineHandler((event) => {
  const pathname = event.url.pathname
  if (!isProtectedPagePath(pathname)) {
    return
  }

  const authCookie = getCookieValue(event.req.headers.get('cookie'), DEMO_AUTH_COOKIE_NAME)
  if (hasDemoAuthCookie(authCookie)) {
    return
  }

  const redirectTarget = `${LOGIN_ROUTE_PATH}?redirect=${encodeURIComponent(event.url.pathname + event.url.search)}`
  return new Response(null, {
    headers: {
      location: redirectTarget
    },
    status: 302
  })
})
