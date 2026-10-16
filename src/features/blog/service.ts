import type { BlogActionState } from '@/features/blog/state.ts'
import { getBlogNotes, saveBlogNote } from '@/features/blog/repository.ts'
import { blogNoteFormSchema } from '@/features/blog/schema.ts'

export async function submitBlogNote(slug: string, formData: FormData): Promise<BlogActionState> {
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
  await saveBlogNote(slug, note)
  const notes = await getBlogNotes(slug)

  return {
    status: 'success',
    message: `Saved a server note for "${slug}". There are now ${notes.length} note(s).`
  }
}
