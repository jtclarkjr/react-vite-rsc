import { z } from 'zod'

export const protectedNoteFormSchema = z.object({
  note: z.string().trim().min(1, 'Enter a protected note before submitting the form.')
})

export type ProtectedNote = z.infer<typeof protectedNoteFormSchema>['note']
