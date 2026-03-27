import type { ProtectedNote } from '@/features/protected/schema.ts'

const protectedNotes: ProtectedNote[] = []

export function getProtectedNotes() {
  return [...protectedNotes]
}

export function saveProtectedNote(note: ProtectedNote) {
  protectedNotes.unshift(note)
  protectedNotes.splice(5)
}
