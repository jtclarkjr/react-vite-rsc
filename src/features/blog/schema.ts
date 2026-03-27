import { z } from 'zod'

export const blogNoteSchema = z
  .string({ error: 'Enter a note before submitting the server action.' })
  .trim()
  .min(1, 'Enter a note before submitting the server action.')

export const blogNoteFormSchema = z.object({
  note: blogNoteSchema
})

export type BlogNote = z.infer<typeof blogNoteSchema>
export type BlogNoteFormValues = z.infer<typeof blogNoteFormSchema>

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest

  describe('blogNoteFormSchema', () => {
    it('returns a trimmed note for valid string input', () => {
      const result = blogNoteFormSchema.safeParse({ note: '  Saved from a schema test  ' })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ note: 'Saved from a schema test' })
    })

    it('rejects a missing note value', () => {
      const result = blogNoteFormSchema.safeParse({})

      expect(result.success).toBe(false)
    })

    it('rejects a non-string note value', () => {
      const result = blogNoteFormSchema.safeParse({
        note: new File(['blog'], 'note.txt', { type: 'text/plain' })
      })

      expect(result.success).toBe(false)
    })

    it('rejects an empty note after trimming', () => {
      const result = blogNoteFormSchema.safeParse({ note: '   ' })

      expect(result.success).toBe(false)
      expect(result.error?.issues[0]?.message).toBe(
        'Enter a note before submitting the server action.'
      )
    })
  })
}
