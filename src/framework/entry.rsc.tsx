import {
  renderToReadableStream,
  createTemporaryReferenceSet,
  decodeReply,
  loadServerAction,
  decodeAction,
  decodeFormState
} from '@vitejs/plugin-rsc/rsc'
import type { ReactNode } from 'react'
import type { ReactFormState } from 'react-dom/client'
import { runRequestMiddleware } from '@/framework/request-middleware.ts'
import { parseRenderRequest } from '@/framework/request.tsx'
import { Root } from '@/root.tsx'
import { resolveRoute, type RequestKind } from '@/router.tsx'

// The schema of payload which is serialized into RSC stream on rsc environment
// and deserialized on ssr/client environments.
export type RscPayload = {
  // this demo renders/serializes/deserizlies entire root html element
  // but this mechanism can be changed to render/fetch different parts of components
  // based on your own route conventions.
  root: ReactNode
  // server action return value of non-progressive enhancement case
  returnValue?: { ok: boolean; data: unknown }
  // server action form state (e.g. useActionState) of progressive enhancement case
  formState?: ReactFormState
}

// the plugin by default assumes `rsc` entry having default export of request handler.
// however, how server entries are executed can be customized by registering own server handler.
export default { fetch: handler }

async function handler(request: Request): Promise<Response> {
  // differentiate RSC, SSR, action, etc.
  const renderRequest = parseRenderRequest(request)
  request = renderRequest.request
  const match = resolveRoute(renderRequest.url)
  const requestKind = toRequestKind(renderRequest)

  const preActionResult = await runRequestMiddleware({
    isRscRequest: renderRequest.isRsc,
    match,
    request,
    requestKind,
    url: renderRequest.url
  })
  if (preActionResult.response) {
    return preActionResult.response
  }

  // handle server function request
  let returnValue: RscPayload['returnValue'] | undefined
  let formState: ReactFormState | undefined
  let temporaryReferences: unknown
  let actionStatus: number | undefined
  let context = preActionResult.context
  if (renderRequest.isAction === true) {
    if (renderRequest.actionId) {
      // action is called via `ReactClient.setServerCallback`.
      const contentType = request.headers.get('content-type')
      const body = contentType?.startsWith('multipart/form-data')
        ? await request.formData()
        : await request.text()
      temporaryReferences = createTemporaryReferenceSet()
      const args = await decodeReply(body, { temporaryReferences })
      const action = await loadServerAction(renderRequest.actionId)
      try {
        const data = await action.apply(null, args)
        returnValue = { ok: true, data }
      } catch (e) {
        returnValue = { ok: false, data: e }
        actionStatus = 500
      }
    } else {
      // otherwise server function is called via `<form action={...}>`
      // before hydration (e.g. when javascript is disabled).
      // aka progressive enhancement.
      const formData = await request.formData()
      const decodedAction = await decodeAction(formData)
      try {
        const result = await decodedAction()
        formState = await decodeFormState(result, formData)
      } catch {
        // there's no single general obvious way to surface this error,
        // so explicitly return classic 500 response.
        return new Response('Internal Server Error: server action failed', {
          status: 500
        })
      }
    }

    const renderResult = await runRequestMiddleware({
      isRscRequest: renderRequest.isRsc,
      match,
      request,
      requestKind,
      url: renderRequest.url
    })
    if (renderResult.response) {
      return renderResult.response
    }
    context = renderResult.context
  }

  // serialization from React VDOM tree to RSC stream.
  // we render RSC stream after handling server function request
  // so that new render reflects updated state from server function call
  // to achieve single round trip to mutate and fetch from server.
  const rscPayload: RscPayload = {
    root: <Root context={context} match={match} url={renderRequest.url} />,
    formState,
    returnValue
  }
  const rscOptions = { temporaryReferences }
  const rscStream = normalizeFlightPreloadAsValue(
    renderToReadableStream<RscPayload>(rscPayload, rscOptions)
  )

  // Respond RSC stream without HTML rendering as decided by `RenderRequest`
  if (renderRequest.isRsc) {
    return new Response(rscStream, {
      status: actionStatus,
      headers: {
        'content-type': 'text/x-component;charset=utf-8'
      }
    })
  }

  // Delegate to SSR environment for html rendering.
  // The plugin provides `loadModule` helper to allow loading SSR environment entry module
  // in RSC environment. however this can be customized by implementing own runtime communication
  // e.g. `@cloudflare/vite-plugin`'s service binding.
  const ssrEntryModule = await import.meta.viteRsc.loadModule<typeof import('./entry.ssr.tsx')>(
    'ssr',
    'index'
  )
  const ssrResult = await ssrEntryModule.renderHTML(rscStream, {
    formState,
    // allow quick simulation of javascript disabled browser
    debugNojs: renderRequest.url.searchParams.has('__nojs')
  })

  // respond html
  return new Response(ssrResult.stream, {
    status: ssrResult.status,
    headers: {
      'Content-type': 'text/html'
    }
  })
}

if (import.meta.hot) {
  import.meta.hot.accept()
}

function normalizeFlightPreloadAsValue(stream: ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buffer = ''

  return stream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          controller.enqueue(encoder.encode(normalizeFlightLine(line) + '\n'))
        }
      },
      flush(controller) {
        buffer += decoder.decode()
        if (buffer) {
          controller.enqueue(encoder.encode(normalizeFlightLine(buffer)))
        }
      }
    })
  )
}

function normalizeFlightLine(line: string) {
  return line.startsWith(':HL[') ? line.replace('"stylesheet"]', '"style"]') : line
}

function toRequestKind(renderRequest: ReturnType<typeof parseRenderRequest>): RequestKind {
  if (renderRequest.isAction) {
    return 'action'
  }

  return renderRequest.isRsc ? 'rsc' : 'ssr'
}
