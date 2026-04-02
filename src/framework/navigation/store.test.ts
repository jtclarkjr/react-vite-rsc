// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import {
  back,
  forward,
  getLocationSnapshot,
  push,
  refresh,
  startNavigationEvents,
  subscribeToLocationChanges,
  subscribeToRefreshRequests
} from '@/framework/navigation/store.ts'

describe('navigation-store', () => {
  let stopNavigationEvents: (() => void) | null

  beforeEach(() => {
    history.replaceState(null, '', '/')
    stopNavigationEvents = startNavigationEvents()
  })

  afterEach(() => {
    stopNavigationEvents?.()
    stopNavigationEvents = null
  })

  it('notifies subscribers when push changes the location', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToLocationChanges(listener)

    push('/about?tab=overview')

    expect(listener).toHaveBeenCalledTimes(1)
    expect(getLocationSnapshot()).toMatchObject({
      pathname: '/about',
      search: '?tab=overview'
    })

    unsubscribe()
  })

  it('notifies refresh subscribers without changing the current location', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToRefreshRequests(listener)

    history.replaceState(null, '', '/blog/example-slug')
    refresh()

    expect(listener).toHaveBeenCalledTimes(1)
    expect(getLocationSnapshot().pathname).toBe('/blog/example-slug')

    unsubscribe()
  })

  it('intercepts same-origin anchor clicks and routes them through history', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToLocationChanges(listener)
    const link = document.createElement('a')

    link.setAttribute('data-route-link', '')
    link.href = '/blog/example-slug'
    link.textContent = 'Blog'
    document.body.append(link)

    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

    expect(listener).toHaveBeenCalledTimes(1)
    expect(getLocationSnapshot().pathname).toBe('/blog/example-slug')

    link.remove()
    unsubscribe()
  })

  it('ignores same-origin anchors that are not page-route links', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToLocationChanges(listener)
    const link = document.createElement('a')

    link.href = '/api/demo/request'
    link.textContent = 'API'
    document.body.append(link)

    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

    expect(listener).not.toHaveBeenCalled()
    expect(getLocationSnapshot().pathname).toBe('/api/demo/request')

    link.remove()
    unsubscribe()
  })

  it('delegates back and forward to browser history', () => {
    const backSpy = vi.spyOn(window.history, 'back')
    const forwardSpy = vi.spyOn(window.history, 'forward')

    back()
    forward()

    expect(backSpy).toHaveBeenCalledTimes(1)
    expect(forwardSpy).toHaveBeenCalledTimes(1)
  })
})
