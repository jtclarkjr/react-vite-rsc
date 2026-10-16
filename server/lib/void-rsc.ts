export async function fetchRscRequest(request: Request): Promise<Response> {
  const entry = await import.meta.viteRsc.loadModule<
    typeof import('../../src/framework/entry.rsc.tsx')
  >('rsc', 'index')

  return entry.fetch(request)
}

export function isInternalRenderRequest(request: Request) {
  const { pathname } = new URL(request.url)
  return (
    ((request.method === 'GET' || request.method === 'HEAD') &&
      (pathname === '/_rsc' || pathname.startsWith('/_rsc/'))) ||
    (request.method === 'POST' && pathname.startsWith('/_actions/'))
  )
}

export function isDocumentRenderRequest(request: Request) {
  const { pathname } = new URL(request.url)
  if (
    /^\/(?:api|auth|__void|@vite|@id|@fs|@react-refresh|node_modules|src|assets)(?:\/|$)/.test(
      pathname
    ) ||
    pathname.startsWith('/__vite') ||
    pathname === '/favicon.ico' ||
    pathname === '/vite.svg' ||
    pathname === '/_rsc' ||
    pathname.startsWith('/_rsc/') ||
    pathname === '/_actions' ||
    pathname.startsWith('/_actions/')
  ) {
    return false
  }

  if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'POST') {
    return false
  }

  const destination = request.headers.get('sec-fetch-dest')
  if (destination) {
    return ['document', 'iframe', 'frame'].includes(destination)
  }

  return request.headers.get('accept')?.includes('text/html') ?? false
}

export function shouldForwardRscRequest(request: Request) {
  return isInternalRenderRequest(request) || isDocumentRenderRequest(request)
}
