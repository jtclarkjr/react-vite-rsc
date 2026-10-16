import { defineHandler } from 'void'
import { createDemoAuthCookieHeader, sanitizeRedirectTarget } from '@server/lib/demo-auth.ts'

export const POST = defineHandler(async (c) => {
  const formData = await c.req.raw.formData()

  return new Response(null, {
    headers: {
      location: sanitizeRedirectTarget(formData.get('redirect')),
      'set-cookie': createDemoAuthCookieHeader()
    },
    status: 303
  })
})
