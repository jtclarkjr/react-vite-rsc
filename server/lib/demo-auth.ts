import { parseRenderRequest } from '@/framework/request.tsx'

export const DEMO_AUTH_COOKIE_NAME = 'demo-auth'
export const LOGIN_ROUTE_PATH = '/login'
export const PROTECTED_DASHBOARD_PATH = '/dashboard'

export function hasDemoAuthCookie(value: string | undefined) {
  return value === '1'
}

export function isProtectedPagePath(pathname: string) {
  return (
    pathname === PROTECTED_DASHBOARD_PATH || pathname.startsWith(`${PROTECTED_DASHBOARD_PATH}/`)
  )
}

export function sanitizeRedirectTarget(value: FormDataEntryValue | string | null | undefined) {
  if (typeof value !== 'string') {
    return PROTECTED_DASHBOARD_PATH
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return PROTECTED_DASHBOARD_PATH
  }

  if (new URL(value, 'https://demo.invalid').origin !== 'https://demo.invalid') {
    return PROTECTED_DASHBOARD_PATH
  }

  return value
}

export function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return undefined
  }

  for (const part of cookieHeader.split(';')) {
    const [key, ...valueParts] = part.trim().split('=')
    if (key === name) {
      try {
        return decodeURIComponent(valueParts.join('='))
      } catch {
        return undefined
      }
    }
  }

  return undefined
}

export function createDemoAuthCookieHeader() {
  return `${DEMO_AUTH_COOKIE_NAME}=1; Path=/; HttpOnly; Max-Age=3600; SameSite=Lax`
}

export function createExpiredDemoAuthCookieHeader() {
  return `${DEMO_AUTH_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`
}
export function getPageAuthRedirect(request: Request) {
  const { url } = parseRenderRequest(request)
  if (
    !isProtectedPagePath(url.pathname) ||
    hasDemoAuthCookie(getCookieValue(request.headers.get('cookie'), DEMO_AUTH_COOKIE_NAME))
  ) {
    return undefined
  }

  return `${LOGIN_ROUTE_PATH}?redirect=${encodeURIComponent(url.pathname + url.search)}`
}
