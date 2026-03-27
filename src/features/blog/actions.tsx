'use server'

import { submitBlogNote } from '@/features/blog/service.ts'
import type { BlogActionState } from '@/features/blog/state.ts'

export async function addBlogNote(
  slug: string,
  _previousState: BlogActionState,
  formData: FormData
): Promise<BlogActionState> {
  return submitBlogNote(slug, formData)
}
