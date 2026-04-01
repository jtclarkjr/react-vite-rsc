import {
  createFromReadableStream,
  createFromFetch,
  setServerCallback,
  createTemporaryReferenceSet,
  encodeReply
} from '@vitejs/plugin-rsc/browser'
import { startTransition, StrictMode, useEffect, useState } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { rscStream } from 'rsc-html-stream/client'
import { GlobalErrorBoundary } from '@/framework/error-boundary'
import type { RscPayload } from '@/framework/rsc-payload.ts'
import {
  startNavigationEvents,
  subscribeToLocationChanges,
  subscribeToRefreshRequests
} from '@/framework/navigation/store.ts'
import { createRscRenderRequest, createServerActionRequest } from '@/framework/request'

async function main() {
  // stash `setPayload` function to trigger re-rendering
  // from outside of `BrowserRoot` component (e.g. server function call, navigation, hmr)
  let setPayload: (v: RscPayload) => void

  // deserialize RSC stream back to React VDOM for CSR
  const initialPayload = await createFromReadableStream<RscPayload>(
    // initial RSC stream is injected in SSR stream as <script>...FLIGHT_DATA...</script>
    rscStream
  )

  // browser root component to (re-)render RSC payload as state
  function BrowserRoot() {
    const [payload, setPayload_] = useState(initialPayload)

    useEffect(() => {
      setPayload = (v) => startTransition(() => setPayload_(v))
    }, [setPayload_])

    useEffect(() => {
      const stopNavigationEvents = startNavigationEvents()
      const unsubscribeLocation = subscribeToLocationChanges(() => {
        void fetchRscPayload()
      })
      const unsubscribeRefresh = subscribeToRefreshRequests(() => {
        void fetchRscPayload()
      })

      return () => {
        unsubscribeRefresh()
        unsubscribeLocation()
        stopNavigationEvents()
      }
    }, [])

    return payload.root
  }

  // re-fetch RSC and trigger re-rendering
  async function fetchRscPayload() {
    const renderRequest = createRscRenderRequest(window.location.href)
    const payload = await createFromFetch<RscPayload>(fetch(renderRequest))
    setPayload(payload)
  }

  // register a handler which will be internally called by React
  // on server function request after hydration.
  setServerCallback(async (id, args) => {
    const temporaryReferences = createTemporaryReferenceSet()
    const renderRequest = createServerActionRequest(window.location.href, {
      id,
      body: await encodeReply(args, { temporaryReferences })
    })
    const payload = await createFromFetch<RscPayload>(fetch(renderRequest), {
      temporaryReferences
    })
    setPayload(payload)
    const { ok, data } = payload.returnValue!
    if (!ok) throw data
    return data
  })

  // hydration
  const browserRoot = (
    <StrictMode>
      <GlobalErrorBoundary>
        <BrowserRoot />
      </GlobalErrorBoundary>
    </StrictMode>
  )
  if ('__NO_HYDRATE' in globalThis) {
    createRoot(document).render(browserRoot)
  } else {
    hydrateRoot(document, browserRoot, {
      formState: initialPayload.formState
    })
  }

  // implement server HMR by triggering re-fetch/render of RSC upon server code change
  if (import.meta.hot) {
    import.meta.hot.on('rsc:update', () => {
      void fetchRscPayload()
    })
  }
}

void main()
