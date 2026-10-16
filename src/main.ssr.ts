import { defineRender } from 'void'
import { fetchRscRequest } from '@server/lib/void-rsc.ts'

// The RSC renderer supplies the document, styles, and hydration bootstrap.
export default defineRender((c) => fetchRscRequest(c.req.raw))
