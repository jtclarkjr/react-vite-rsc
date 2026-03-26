const blogNotes = new Map<string, string[]>()

export function getBlogNotes(slug: string) {
  return blogNotes.get(slug) ?? []
}

export function saveBlogNote(slug: string, note: string) {
  const existing = blogNotes.get(slug) ?? []
  existing.unshift(note)
  blogNotes.set(slug, existing.slice(0, 5))
}
