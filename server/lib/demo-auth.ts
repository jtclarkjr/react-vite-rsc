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

  return value
}

export function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return undefined
  }

  for (const part of cookieHeader.split(';')) {
    const [key, ...valueParts] = part.trim().split('=')
    if (key === name) {
      return decodeURIComponent(valueParts.join('='))
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
