import { redirect } from '@/framework/middleware.ts'
import type { RouteContext, RouteMiddleware } from '@/router.tsx'

const DEMO_SESSION_COOKIE = 'demo-session'
const DEMO_SESSION_CONTEXT_KEY = 'demoSession'
const PROTECTED_GREETING_CONTEXT_KEY = 'protectedGreeting'

export type DemoSession = {
  user: string
}

export const requireDemoSession: RouteMiddleware = ({ context, request, requestKind, url }) => {
  const session = getDemoSession(request)
  if (!session) {
    const next = `${url.pathname}${url.search}`
    return redirect(`/login?next=${encodeURIComponent(next)}`, requestKind === 'action' ? 303 : 302)
  }

  context[DEMO_SESSION_CONTEXT_KEY] = session
}

export const addProtectedGreeting: RouteMiddleware = ({ context }) => {
  const session = getDemoSessionFromContext(context)
  if (!session) {
    return
  }

  context[PROTECTED_GREETING_CONTEXT_KEY] = `Welcome back, ${session.user}.`
}

export function getDemoSession(request: Request): DemoSession | null {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) {
    return null
  }

  const cookies = parseCookieHeader(cookieHeader)
  const user = cookies.get(DEMO_SESSION_COOKIE)?.trim()
  if (!user) {
    return null
  }

  return { user }
}

export function getDemoSessionFromContext(context: RouteContext): DemoSession | null {
  const value = context[DEMO_SESSION_CONTEXT_KEY]
  if (!value || typeof value !== 'object') {
    return null
  }

  const user = (value as { user?: unknown }).user
  return typeof user === 'string' && user.length > 0 ? { user } : null
}

export function getProtectedGreetingFromContext(context: RouteContext) {
  const value = context[PROTECTED_GREETING_CONTEXT_KEY]
  return typeof value === 'string' ? value : ''
}

function parseCookieHeader(header: string) {
  const cookies = new Map<string, string>()

  for (const part of header.split(';')) {
    const [rawName, ...rawValueParts] = part.trim().split('=')
    if (!rawName) {
      continue
    }

    cookies.set(rawName, decodeURIComponent(rawValueParts.join('=')))
  }

  return cookies
}
