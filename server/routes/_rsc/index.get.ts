import { defineHandler } from 'nitro'
import { fetchRscRequest } from '@server/lib/vite-rsc.ts'

export default defineHandler((event) => fetchRscRequest(event.req))
