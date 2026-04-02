import type { ReactNode } from 'react'
import {
  pageRouteDefinitions,
  type PageRouteParams as GeneratedPageRouteParams,
  type PageRoutePattern
} from '@/page-routes.generated.ts'

export type RoutePattern = PageRoutePattern
export type RouteParams<P extends RoutePattern = RoutePattern> = GeneratedPageRouteParams<P>

export type PageProps<P extends RoutePattern = RoutePattern> = {
  params: RouteParams<P>
  url: URL
}

export type RouteModule<P extends RoutePattern = RoutePattern> = {
  default: (props: PageProps<P>) => Promise<ReactNode> | ReactNode
}

export type MatchedRoute<P extends RoutePattern = RoutePattern> = {
  module: RouteModule<P>
  params: RouteParams<P>
  pattern: P
}

const routeModules = import.meta.glob<RouteModule>('./routes/**/page.tsx', {
  eager: true
})

const routes = pageRouteDefinitions
  .map((definition) => ({
    ...definition,
    module: routeModules[definition.file] as RouteModule<typeof definition.pattern>
  }))
  .sort((a, b) => compareSpecificity(a.segments, b.segments))

export function resolveRoute(url: URL): MatchedRoute | null {
  const pathnameSegments = getPathSegments(url.pathname)

  for (const route of routes) {
    const params = matchSegments(route.pattern, route.segments, pathnameSegments)
    if (params) {
      return {
        module: route.module,
        params,
        pattern: route.pattern
      }
    }
  }

  return null
}

function getPathSegments(pathname: string): string[] {
  return pathname.split('/').filter(Boolean)
}

function matchSegments<P extends RoutePattern>(
  _pattern: P,
  routeSegments: readonly string[],
  pathnameSegments: string[]
): RouteParams<P> | null {
  if (routeSegments.length !== pathnameSegments.length) {
    return null
  }

  const params: Record<string, string> = {}

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

  return params as RouteParams<P>
}

function compareSpecificity(a: readonly string[], b: readonly string[]) {
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
