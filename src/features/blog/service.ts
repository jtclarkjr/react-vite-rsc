import type { BlogActionState } from '@/features/blog/state.ts'
import { getBlogNotes, saveBlogNote } from '@/features/blog/repository.ts'
import { blogNoteFormSchema } from '@/features/blog/schema.ts'

export function submitBlogNote(slug: string, formData: FormData): BlogActionState {
  const parsedForm = blogNoteFormSchema.safeParse({
    note: formData.get('note')
  })

  if (!parsedForm.success) {
    return {
      status: 'error',
      message:
        parsedForm.error.issues[0]?.message ?? 'Enter a note before submitting the server action.'
    }
  }

  const { note } = parsedForm.data
  saveBlogNote(slug, note)

  return {
    status: 'success',
    message: `Saved a server note for "${slug}". There are now ${getBlogNotes(slug).length} note(s).`
  }
}

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest

  describe('submitBlogNote', () => {
    it('returns an error for invalid form data without saving', () => {
      const slug = 'invalid-form-data'
      const formData = new FormData()
      formData.set('note', new File(['blog'], 'note.txt', { type: 'text/plain' }))

      const result = submitBlogNote(slug, formData)

      expect(result).toEqual({
        status: 'error',
        message: 'Enter a note before submitting the server action.'
      })
      expect(getBlogNotes(slug)).toEqual([])
    })

    it('saves a validated note and reports the current count', () => {
      const slug = 'valid-form-data'
      const formData = new FormData()
      formData.set('note', '  Saved from the action test  ')

      const result = submitBlogNote(slug, formData)

      expect(getBlogNotes(slug)).toEqual(['Saved from the action test'])
      expect(result).toEqual({
        status: 'success',
        message: 'Saved a server note for "valid-form-data". There are now 1 note(s).'
      })
    })
  })
}
