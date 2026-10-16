import { defineMiddleware } from 'void'
import { classifyLoggedRequest } from '@server/lib/request-logger.ts'

export default defineMiddleware(async (c, next) => {
  const kind = classifyLoggedRequest(c.req.raw)
  const startedAt = Date.now()

  await next()

  if (kind) {
    console.log(
      `[void] ${kind} ${c.req.method} ${c.req.path} ${c.res.status} ${Date.now() - startedAt}ms`
    )
  }
})
