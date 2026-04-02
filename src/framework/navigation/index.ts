'use client'

import { useMemo, useSyncExternalStore } from 'react'
import type { PageRouteHref } from '@/page-routes.generated.ts'
import {
  back,
  forward,
  getLocationSnapshot,
  push,
  refresh,
  replace,
  subscribeToLocationChanges
} from '@/framework/navigation/store.ts'

type ReadonlySearchParamsMethods = Pick<
  URLSearchParams,
  | 'entries'
  | 'forEach'
  | 'get'
  | 'getAll'
  | 'has'
  | 'keys'
  | 'toString'
  | 'values'
  | typeof Symbol.iterator
>

export type AppRouter = {
  back: () => void
  forward: () => void
  push: (href: PageRouteHref) => void
  refresh: () => void
  replace: (href: PageRouteHref) => void
}

export type ReadonlySearchParams = ReadonlySearchParamsMethods

const router: AppRouter = {
  back,
  forward,
  push(href) {
    push(href)
  },
  refresh,
  replace(href) {
    replace(href)
  }
}

export function useRouter() {
  return router
}

export function usePathname() {
  return useSyncExternalStore(
    subscribeToLocationChanges,
    () => getLocationSnapshot().pathname,
    () => ''
  )
}

export function useSearchParams(): ReadonlySearchParams {
  const search = useSyncExternalStore(
    subscribeToLocationChanges,
    () => getLocationSnapshot().search,
    () => ''
  )

  return useMemo(() => new URLSearchParams(search) as ReadonlySearchParams, [search])
}
