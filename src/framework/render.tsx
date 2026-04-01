import {
  createTemporaryReferenceSet,
  decodeAction,
  decodeReply,
  loadServerAction,
  renderToReadableStream
} from '@vitejs/plugin-rsc/rsc'
import { Root } from '@/root.tsx'
import { parseRenderRequest } from '@/framework/request.tsx'
import type { RscPayload } from '@/framework/rsc-payload.ts'

type RenderPipelineResult = {
  actionStatus?: number
  rscStream: ReadableStream<Uint8Array>
  url: URL
}

export async function renderRequestToDocumentResponse(request: Request): Promise<Response> {
  const pipelineResult = await renderRequestToRscStream(request)
  if (pipelineResult instanceof Response) {
    return pipelineResult
  }

  const ssrEntryModule = await import.meta.viteRsc.loadModule<typeof import('./entry.ssr.tsx')>(
    'ssr',
    'index'
  )
  const ssrResult = await ssrEntryModule.renderHTML(pipelineResult.rscStream, {
    debugNojs: pipelineResult.url.searchParams.has('__nojs')
  })

  return new Response(ssrResult.stream, {
    status: ssrResult.status,
    headers: {
      'content-type': 'text/html'
    }
  })
}

export async function renderRequestToRscResponse(request: Request): Promise<Response> {
  const pipelineResult = await renderRequestToRscStream(request)
  if (pipelineResult instanceof Response) {
    return pipelineResult
  }

  return new Response(pipelineResult.rscStream, {
    status: pipelineResult.actionStatus,
    headers: {
      'content-type': 'text/x-component;charset=utf-8'
    }
  })
}

async function renderRequestToRscStream(
  request: Request
): Promise<Response | RenderPipelineResult> {
  const renderRequest = parseRenderRequest(request)
  request = renderRequest.request

  let returnValue: RscPayload['returnValue'] | undefined
  let temporaryReferences: unknown
  let actionStatus: number | undefined

  if (renderRequest.isAction) {
    if (renderRequest.actionId) {
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
      } catch (error) {
        returnValue = { ok: false, data: error }
        actionStatus = 500
      }
    } else {
      const formData = await request.formData()
      const decodedAction = await decodeAction(formData)

      try {
        await decodedAction()
        // React DOM SSR stalls when `formState` is passed through this full-document
        // response path, so progressive enhancement re-renders with persisted data only.
      } catch {
        return new Response('Internal Server Error: server action failed', {
          status: 500
        })
      }
    }
  }

  const rscPayload: RscPayload = {
    root: <Root url={renderRequest.url} />,
    returnValue
  }
  const rscStream = normalizeFlightPreloadAsValue(
    renderToReadableStream<RscPayload>(rscPayload, { temporaryReferences })
  )

  return {
    actionStatus,
    rscStream,
    url: renderRequest.url
  }
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
