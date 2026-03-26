'use server'

import { getBlogNotes, saveBlogNote } from '@/features/blog/repository.ts'
import type { BlogActionState } from '@/features/blog/state.ts'

export async function addBlogNote(
  slug: string,
  _previousState: BlogActionState,
  formData: FormData
): Promise<BlogActionState> {
  const rawNote = formData.get('note')
  const note = typeof rawNote === 'string' ? rawNote.trim() : ''

  if (!note) {
    return {
      status: 'error',
      message: 'Enter a note before submitting the server action.'
    }
  }

  saveBlogNote(slug, note)

  return {
    status: 'success',
    message: `Saved a server note for "${slug}". There are now ${getBlogNotes(slug).length} note(s).`
  }
}
