import { defineMiddleware } from 'void'
import {
  fetchRscRequest,
  isInternalRenderRequest,
  shouldForwardRscRequest
} from '@server/lib/void-rsc.ts'

export default defineMiddleware(async (c, next) => {
  if (!shouldForwardRscRequest(c.req.raw)) {
    await next()
    return
  }

  const response = await fetchRscRequest(c.req.raw)
  if (isInternalRenderRequest(c.req.raw)) {
    response.headers.set('cache-control', 'no-store')
  }

  return response
})
