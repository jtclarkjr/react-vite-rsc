import { defineMiddleware } from 'void'
import { getPageAuthRedirect } from '@server/lib/demo-auth.ts'

export default defineMiddleware(async (c, next) => {
  let location: string | undefined
  try {
    location = getPageAuthRedirect(c.req.raw)
  } catch {
    return new Response('Invalid render request', {
      status: 400,
      headers: { 'cache-control': 'no-store' }
    })
  }

  if (location) {
    return new Response(null, {
      status: 302,
      headers: { location, 'cache-control': 'no-store' }
    })
  }

  await next()
})
