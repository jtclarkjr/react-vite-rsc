import { defineHandler } from 'void'
import { createExpiredDemoAuthCookieHeader, LOGIN_ROUTE_PATH } from '@server/lib/demo-auth.ts'

export const POST = defineHandler(() => {
  return new Response(null, {
    headers: {
      location: LOGIN_ROUTE_PATH,
      'set-cookie': createExpiredDemoAuthCookieHeader()
    },
    status: 303
  })
})
