import { fetchSsrRequest } from '@server/lib/vite-rsc.ts'

export default function renderer({ req }: { req: Request }) {
  return fetchSsrRequest(req)
}
