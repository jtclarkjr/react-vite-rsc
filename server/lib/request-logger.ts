type LoggedRequestKind = 'api' | 'page'

export function classifyLoggedRequest(pathname: string): LoggedRequestKind | null {
  if (pathname === '/api' || pathname.startsWith('/api/')) {
    return 'api'
  }

  if (
    pathname.startsWith('/_rsc') ||
    pathname.startsWith('/_actions') ||
    pathname.startsWith('/auth/')
  ) {
    return null
  }

  if (pathname.startsWith('/assets/') || pathname === '/vite.svg') {
    return null
  }

  if (/\.[a-z0-9]+$/i.test(pathname)) {
    return null
  }

  return 'page'
}
