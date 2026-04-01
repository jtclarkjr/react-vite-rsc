import { defineHandler } from 'nitro'
import {
  PROTECTED_DASHBOARD_PATH,
  createDemoAuthCookieHeader,
  sanitizeRedirectTarget
} from '@server/lib/demo-auth.ts'

export default defineHandler(async (event) => {
  const formData = await event.req.formData()
  const redirectTarget = sanitizeRedirectTarget(formData.get('redirect'))

  return new Response(null, {
    headers: {
      location: redirectTarget || PROTECTED_DASHBOARD_PATH,
      'set-cookie': createDemoAuthCookieHeader()
    },
    status: 303
  })
})
