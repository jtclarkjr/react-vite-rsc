import { isDocumentRenderRequest } from '@server/lib/void-rsc.ts'

type LoggedRequestKind = 'api' | 'page'

export function classifyLoggedRequest(request: Request): LoggedRequestKind | null {
  const pathname = new URL(request.url).pathname
  if (pathname === '/api' || pathname.startsWith('/api/')) {
    return 'api'
  }

  const purpose = request.headers.get('purpose') ?? request.headers.get('sec-purpose')
  if (purpose?.toLowerCase().includes('prefetch')) {
    return null
  }

  return isDocumentRenderRequest(request) ? 'page' : null
}
