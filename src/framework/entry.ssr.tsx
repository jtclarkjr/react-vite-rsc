import { createFromReadableStream } from '@vitejs/plugin-rsc/ssr'
import type { ReactFormState } from 'react-dom/client'
import { renderToReadableStream } from 'react-dom/server.edge'
import { injectRSCPayload } from 'rsc-html-stream/server'
import type { RscPayload } from '@/framework/rsc-payload.ts'

export default {
  fetch
}

export async function fetch(request: Request) {
  const rscEntryModule = await import.meta.viteRsc.loadModule<typeof import('./entry.rsc.tsx')>(
    'rsc',
    'index'
  )
  let rscFetch: typeof rscEntryModule.fetch | undefined
  if (typeof rscEntryModule.fetch === 'function') {
    rscFetch = rscEntryModule.fetch
  } else if (typeof rscEntryModule.default?.fetch === 'function') {
    rscFetch = rscEntryModule.default.fetch
  }

  if (!rscFetch) {
    throw new TypeError('RSC entry did not expose a fetch handler')
  }

  return rscFetch(request)
}

export async function renderHTML(
  rscStream: ReadableStream<Uint8Array>,
  options: {
    formState?: ReactFormState
    nonce?: string
    debugNojs?: boolean
  }
): Promise<{ stream: ReadableStream<Uint8Array>; status?: number }> {
  // duplicate one RSC stream into two.
  // - one for SSR (ReactClient.createFromReadableStream below)
  // - another for browser hydration payload by injecting <script>...FLIGHT_DATA...</script>.
  const [rscStream1, rscStream2] = rscStream.tee()
  const payload = await createFromReadableStream<RscPayload>(rscStream1)

  // render html (traditional SSR)
  const bootstrapScriptContent = await import.meta.viteRsc.loadBootstrapScriptContent('index')
  let htmlStream: ReadableStream<Uint8Array>
  let status: number | undefined
  try {
    htmlStream = await renderToReadableStream(payload.root, {
      bootstrapScriptContent: options?.debugNojs ? undefined : bootstrapScriptContent,
      nonce: options?.nonce,
      formState: options?.formState
    })
  } catch {
    // fallback to render an empty shell and run pure CSR on browser,
    // which can replay server component error and trigger error boundary.
    status = 500
    htmlStream = await renderToReadableStream(
      <html>
        <body>
          <noscript>Internal Server Error: SSR failed</noscript>
        </body>
      </html>,
      {
        bootstrapScriptContent:
          `self.__NO_HYDRATE=1;` + (options?.debugNojs ? '' : bootstrapScriptContent),
        nonce: options?.nonce
      }
    )
  }

  let responseStream: ReadableStream<Uint8Array> = htmlStream
  if (!options?.debugNojs) {
    // initial RSC stream is injected in HTML stream as <script>...FLIGHT_DATA...</script>
    // using utility made by devongovett https://github.com/devongovett/rsc-html-stream
    responseStream = responseStream.pipeThrough(
      injectRSCPayload(rscStream2, {
        nonce: options?.nonce
      })
    )
  }

  responseStream = normalizePreloadAsValue(responseStream)

  return { stream: responseStream, status }
}

function normalizePreloadAsValue(stream: ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  return stream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        const html = decoder.decode(chunk, { stream: true })
        controller.enqueue(encoder.encode(html.replaceAll(' as="stylesheet"', ' as="style"')))
      },
      flush(controller) {
        const html = decoder.decode()
        if (html) {
          controller.enqueue(encoder.encode(html.replaceAll(' as="stylesheet"', ' as="style"')))
        }
      }
    })
  )
}
