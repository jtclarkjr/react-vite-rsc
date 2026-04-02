type Listener = () => void

export type LocationSnapshot = {
  hash: string
  href: string
  pathname: string
  search: string
}

const locationListeners = new Set<Listener>()
const refreshListeners = new Set<Listener>()

let cleanupNavigationEvents: (() => void) | null = null

export function getLocationSnapshot(): LocationSnapshot {
  if (typeof window === 'undefined') {
    return {
      hash: '',
      href: '',
      pathname: '',
      search: ''
    }
  }

  return {
    hash: window.location.hash,
    href: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search
  }
}

export function subscribeToLocationChanges(listener: Listener) {
  locationListeners.add(listener)

  return () => {
    locationListeners.delete(listener)
  }
}

export function subscribeToRefreshRequests(listener: Listener) {
  refreshListeners.add(listener)

  return () => {
    refreshListeners.delete(listener)
  }
}

export function push(href: string) {
  window.history.pushState(null, '', href)
}

export function replace(href: string) {
  window.history.replaceState(null, '', href)
}

export function back() {
  window.history.back()
}

export function forward() {
  window.history.forward()
}

export function refresh() {
  notifyRefreshListeners()
}

export function startNavigationEvents() {
  if (cleanupNavigationEvents) {
    return cleanupNavigationEvents
  }

  function notifyLocationChange() {
    for (const listener of locationListeners) {
      listener()
    }
  }

  function onPopState() {
    notifyLocationChange()
  }

  window.addEventListener('popstate', onPopState)

  const oldPushState = window.history.pushState.bind(window.history)
  window.history.pushState = function (...args) {
    const result = oldPushState(...args)
    notifyLocationChange()
    return result
  }

  const oldReplaceState = window.history.replaceState.bind(window.history)
  window.history.replaceState = function (...args) {
    const result = oldReplaceState(...args)
    notifyLocationChange()
    return result
  }

  function onClick(event: MouseEvent) {
    const link = (event.target as Element | null)?.closest('a')
    if (
      link &&
      link instanceof HTMLAnchorElement &&
      link.hasAttribute('data-route-link') &&
      link.href &&
      (!link.target || link.target === '_self') &&
      link.origin === location.origin &&
      !link.hasAttribute('download') &&
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.shiftKey &&
      !event.defaultPrevented
    ) {
      event.preventDefault()
      window.history.pushState(null, '', link.href)
    }
  }

  document.addEventListener('click', onClick)

  cleanupNavigationEvents = () => {
    document.removeEventListener('click', onClick)
    window.removeEventListener('popstate', onPopState)
    window.history.pushState = oldPushState
    window.history.replaceState = oldReplaceState
    cleanupNavigationEvents = null
  }

  return cleanupNavigationEvents
}

function notifyRefreshListeners() {
  for (const listener of refreshListeners) {
    listener()
  }
}
