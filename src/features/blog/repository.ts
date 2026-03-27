import type { BlogNote } from '@/features/blog/schema.ts'

const blogNotes = new Map<string, BlogNote[]>()

export function getBlogNotes(slug: string) {
  return blogNotes.get(slug) ?? []
}

export function saveBlogNote(slug: string, note: BlogNote) {
  const existing = blogNotes.get(slug) ?? []
  existing.unshift(note)
  blogNotes.set(slug, existing.slice(0, 5))
}
