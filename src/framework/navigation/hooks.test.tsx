// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import type { AppRouter } from '@/framework/navigation'
import { usePathname, useRouter, useSearchParams } from '@/framework/navigation'
import { startNavigationEvents, subscribeToRefreshRequests } from '@/framework/navigation/store.ts'

describe('navigation hooks', () => {
  let container: HTMLDivElement | null
  let root: ReturnType<typeof createRoot> | null
  let stopNavigationEvents: (() => void) | null

  beforeEach(() => {
    history.replaceState(null, '', '/')
    stopNavigationEvents = startNavigationEvents()
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount()
      })
    }
    container?.remove()
    stopNavigationEvents?.()
    root = null
    container = null
    stopNavigationEvents = null
  })

  it('tracks pathname changes after push navigation', async () => {
    let pathname = ''
    let router: AppRouter | null = null

    function Probe() {
      pathname = usePathname()
      router = useRouter()
      return null
    }

    await act(async () => {
      root!.render(<Probe />)
    })

    await act(async () => {
      router?.push('/about')
    })

    expect(pathname).toBe('/about')
  })

  it('updates search params after replace navigation', async () => {
    let searchParamValue: string | null = null
    let router: AppRouter | null = null

    function Probe() {
      searchParamValue = useSearchParams().get('view')
      router = useRouter()
      return null
    }

    await act(async () => {
      root!.render(<Probe />)
    })

    await act(async () => {
      router?.replace('/blog/example-slug?view=full')
    })

    expect(searchParamValue).toBe('full')
  })

  it('forwards refresh requests without changing the current pathname', async () => {
    const onRefresh = vi.fn()
    const unsubscribe = subscribeToRefreshRequests(onRefresh)
    let pathname = ''
    let router: AppRouter | null = null

    function Probe() {
      pathname = usePathname()
      router = useRouter()
      return null
    }

    await act(async () => {
      root!.render(<Probe />)
    })

    await act(async () => {
      router?.replace('/about')
    })

    await act(async () => {
      router?.refresh()
    })

    expect(onRefresh).toHaveBeenCalledTimes(1)
    expect(pathname).toBe('/about')

    unsubscribe()
  })
})
