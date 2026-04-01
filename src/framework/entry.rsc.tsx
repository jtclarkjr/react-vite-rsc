import { parseRenderRequest } from '@/framework/request.tsx'
import { renderRequestToDocumentResponse, renderRequestToRscResponse } from '@/framework/render.tsx'

export default { fetch }

export async function fetch(request: Request): Promise<Response> {
  const renderRequest = parseRenderRequest(request)
  if (renderRequest.isRsc) {
    return renderRequestToRscResponse(request)
  }

  return renderRequestToDocumentResponse(request)
}

if (import.meta.hot) {
  import.meta.hot.accept()
}
