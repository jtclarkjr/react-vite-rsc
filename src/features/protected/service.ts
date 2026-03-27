import type { ProtectedActionState } from '@/features/protected/state.ts'
import { saveProtectedNote, getProtectedNotes } from '@/features/protected/repository.ts'
import { protectedNoteFormSchema } from '@/features/protected/schema.ts'

export function submitProtectedNote(formData: FormData): ProtectedActionState {
  const parsedForm = protectedNoteFormSchema.safeParse({
    note: formData.get('note')
  })

  if (!parsedForm.success) {
    return {
      status: 'error',
      message:
        parsedForm.error.issues[0]?.message ?? 'Enter a protected note before submitting the form.'
    }
  }

  saveProtectedNote(parsedForm.data.note)

  return {
    status: 'success',
    message: `Saved a protected note. There are now ${getProtectedNotes().length} note(s).`
  }
}
