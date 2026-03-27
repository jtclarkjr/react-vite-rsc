'use client'

import { useMemo, useSyncExternalStore } from 'react'
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
  push: (href: string) => void
  refresh: () => void
  replace: (href: string) => void
}

export type ReadonlySearchParams = ReadonlySearchParamsMethods

const router: AppRouter = {
  back,
  forward,
  push,
  refresh,
  replace
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
