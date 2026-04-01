import { definePlugin } from 'nitro'
import { classifyLoggedRequest } from '@server/lib/request-logger.ts'

type RequestLogContext = {
  kind: 'api' | 'page'
  startedAt: number
}

export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    const kind = classifyLoggedRequest(event.req)
    if (!kind) {
      return
    }

    event.req.context ??= {}
    event.req.context.requestLog = {
      kind,
      startedAt: Date.now()
    } satisfies RequestLogContext
  })

  nitroApp.hooks.hook('response', (response, event) => {
    const pathname = new URL(event.req.url).pathname
    const requestLog = event.req.context?.requestLog as RequestLogContext | undefined
    if (!requestLog) {
      return
    }

    const duration = Date.now() - requestLog.startedAt
    const status =
      typeof response === 'object' &&
      response &&
      'status' in response &&
      typeof response.status === 'number'
        ? response.status
        : 200

    console.log(
      `[nitro] ${requestLog.kind} ${event.req.method} ${pathname} ${status} ${duration}ms`
    )
  })
})
