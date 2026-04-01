import { fetchViteEnv } from 'nitro/vite/runtime'

export function fetchRscRequest(request: Request) {
  return fetchViteEnv('rsc', request)
}

export function fetchSsrRequest(request: Request) {
  return fetchViteEnv('ssr', request)
}
