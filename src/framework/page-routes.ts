export type RouteSearchPrimitive = boolean | number | string | null | undefined
export type RouteSearchValue = RouteSearchPrimitive | readonly RouteSearchPrimitive[]
export type RouteSearchRecord = Record<string, RouteSearchValue>
export type RouteSearchInput = RouteSearchRecord | URLSearchParams | string

export type RouteHrefOptions = {
  search?: RouteSearchInput
}

declare const routeHrefBrand: unique symbol

export type RouteHref<P extends string = string> = string & {
  readonly [routeHrefBrand]: P
}

export function brandRouteHref<P extends string>(href: string): RouteHref<P> {
  return href as RouteHref<P>
}

export function encodeRouteSegment(value: string) {
  return encodeURIComponent(value)
}

export function toHrefString<P extends string>(href: RouteHref<P>) {
  return href as string
}

export function withRouteSearch(pathname: string, search?: RouteSearchInput) {
  const searchString = toSearchString(search)
  return searchString ? `${pathname}?${searchString}` : pathname
}

function toSearchString(search: RouteSearchInput | undefined) {
  if (!search) {
    return ''
  }

  if (typeof search === 'string') {
    return search.startsWith('?') ? search.slice(1) : search
  }

  const params =
    search instanceof URLSearchParams ? new URLSearchParams(search) : new URLSearchParams()

  if (!(search instanceof URLSearchParams)) {
    for (const [key, value] of Object.entries(search)) {
      appendSearchParam(params, key, value)
    }
  }

  return params.toString()
}

function appendSearchParam(params: URLSearchParams, key: string, value: RouteSearchValue) {
  if (isRouteSearchArray(value)) {
    for (const item of value) {
      appendSearchPrimitive(params, key, item)
    }
    return
  }

  appendSearchPrimitive(params, key, value)
}

function isRouteSearchArray(value: RouteSearchValue): value is readonly RouteSearchPrimitive[] {
  return Array.isArray(value)
}

function appendSearchPrimitive(params: URLSearchParams, key: string, value: RouteSearchPrimitive) {
  if (value === undefined || value === null) {
    return
  }

  params.append(key, String(value))
}
