import { blogNotes } from '@schema'
import { and, db, desc, eq, notInArray } from 'void/db'
import type { BlogNote } from '@/features/blog/schema.ts'

export async function getBlogNotes(slug: string): Promise<BlogNote[]> {
  const rows = await db
    .select({ note: blogNotes.note })
    .from(blogNotes)
    .where(eq(blogNotes.slug, slug))
    .orderBy(desc(blogNotes.id))
    .limit(5)

  return rows.map((row) => row.note)
}

export async function saveBlogNote(slug: string, note: BlogNote) {
  const newestNotes = db
    .select({ id: blogNotes.id })
    .from(blogNotes)
    .where(eq(blogNotes.slug, slug))
    .orderBy(desc(blogNotes.id))
    .limit(5)

  await db.batch([
    db.insert(blogNotes).values({ slug, note }),
    db.delete(blogNotes).where(and(eq(blogNotes.slug, slug), notInArray(blogNotes.id, newestNotes)))
  ])
}
