import { defineHandler } from 'nitro'
import { createExpiredDemoAuthCookieHeader, LOGIN_ROUTE_PATH } from '@server/lib/demo-auth.ts'

export default defineHandler(() => {
  return new Response(null, {
    headers: {
      location: LOGIN_ROUTE_PATH,
      'set-cookie': createExpiredDemoAuthCookieHeader()
    },
    status: 303
  })
})
