import type { ReactNode } from 'react'

export type RouteParams = Record<string, string>
export type RouteContext = Record<string, unknown>
export type RequestKind = 'ssr' | 'rsc' | 'action'

export type RouteRedirect = {
  type: 'redirect'
  location: string
  status?: 301 | 302 | 303 | 307 | 308
}

export type RouteMiddlewareArgs = {
  context: RouteContext
  params: RouteParams
  request: Request
  requestKind: RequestKind
  url: URL
}

export type RouteMiddlewareResult = void | Response | RouteRedirect
export type RouteMiddleware = (
  args: RouteMiddlewareArgs
) => Promise<RouteMiddlewareResult> | RouteMiddlewareResult

export type PageProps = {
  context: RouteContext
  params: RouteParams
  url: URL
}

export type RouteModule = {
  default: (props: PageProps) => Promise<ReactNode> | ReactNode
  middleware?: RouteMiddleware[]
}

export type MatchedRoute = {
  module: RouteModule
  params: RouteParams
}

const routeModules = import.meta.glob<RouteModule>('./routes/**/page.tsx', {
  eager: true
})

const routes = Object.entries(routeModules)
  .map(([file, module]) => ({
    file,
    module,
    segments: toRouteSegments(file)
  }))
  .sort((a, b) => compareSpecificity(a.segments, b.segments))

export function resolveRoute(url: URL): MatchedRoute | null {
  const pathnameSegments = getPathSegments(url.pathname)

  for (const route of routes) {
    const params = matchSegments(route.segments, pathnameSegments)
    if (params) {
      return {
        module: route.module,
        params
      }
    }
  }

  return null
}

function toRouteSegments(file: string): string[] {
  const normalized = file
    .replace('./routes/', '')
    .replace(/page\.tsx$/, '')
    .replace(/\/$/, '')
  return getPathSegments(normalized)
}

function getPathSegments(pathname: string): string[] {
  return pathname.split('/').filter(Boolean)
}

function matchSegments(routeSegments: string[], pathnameSegments: string[]): RouteParams | null {
  if (routeSegments.length !== pathnameSegments.length) {
    return null
  }

  const params: RouteParams = {}

  for (const [index, routeSegment] of routeSegments.entries()) {
    const pathnameSegment = pathnameSegments[index]
    if (!pathnameSegment) {
      return null
    }

    const dynamicMatch = /^\[([^\]]+)\]$/.exec(routeSegment)
    if (dynamicMatch) {
      params[dynamicMatch[1]] = decodeURIComponent(pathnameSegment)
      continue
    }

    if (routeSegment !== pathnameSegment) {
      return null
    }
  }

  return params
}

function compareSpecificity(a: string[], b: string[]) {
  const max = Math.max(a.length, b.length)

  for (let index = 0; index < max; index += 1) {
    const aSegment = a[index]
    const bSegment = b[index]

    if (aSegment === bSegment) {
      continue
    }

    const aDynamic = isDynamicSegment(aSegment)
    const bDynamic = isDynamicSegment(bSegment)

    if (aDynamic !== bDynamic) {
      return aDynamic ? 1 : -1
    }
  }

  return b.length - a.length
}

function isDynamicSegment(segment: string | undefined) {
  return Boolean(segment && /^\[([^\]]+)\]$/.test(segment))
}

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest

  describe('resolveRoute', () => {
    it('matches dynamic blog slugs from the filesystem route', () => {
      const match = resolveRoute(new URL('https://example.com/blog/alpha-123'))

      expect(match).not.toBeNull()
      expect(match?.params.slug).toBe('alpha-123')
    })
  })
}
