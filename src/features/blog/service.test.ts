import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getBlogNotes, saveBlogNote } from '@/features/blog/repository.ts'
import { submitBlogNote } from '@/features/blog/service.ts'

vi.mock('@/features/blog/repository.ts', () => ({
  getBlogNotes: vi.fn(),
  saveBlogNote: vi.fn()
}))

beforeEach(() => {
  vi.resetAllMocks()
})

describe('submitBlogNote', () => {
  it.each([null, '   ', new File(['blog'], 'note.txt', { type: 'text/plain' })])(
    'rejects invalid form data without touching the database: %s',
    async (note) => {
      const formData = new FormData()
      if (note !== null) formData.set('note', note)

      await expect(submitBlogNote('invalid-form-data', formData)).resolves.toEqual({
        status: 'error',
        message: 'Enter a note before submitting the server action.'
      })
      expect(saveBlogNote).not.toHaveBeenCalled()
      expect(getBlogNotes).not.toHaveBeenCalled()
    }
  )

  it('saves a trimmed note before reading and reporting the current count', async () => {
    const formData = new FormData()
    formData.set('note', '  Saved from the action test  ')
    vi.mocked(saveBlogNote).mockResolvedValue(undefined)
    vi.mocked(getBlogNotes).mockResolvedValue(['Saved from the action test', 'Earlier note'])

    await expect(submitBlogNote('valid-form-data', formData)).resolves.toEqual({
      status: 'success',
      message: 'Saved a server note for "valid-form-data". There are now 2 note(s).'
    })
    expect(saveBlogNote).toHaveBeenCalledWith('valid-form-data', 'Saved from the action test')
    expect(getBlogNotes).toHaveBeenCalledWith('valid-form-data')
    expect(saveBlogNote).toHaveBeenCalledBefore(vi.mocked(getBlogNotes))
  })

  it('propagates a failed save without reporting success', async () => {
    const formData = new FormData()
    formData.set('note', 'Unsaved note')
    const failure = new Error('Database unavailable')
    vi.mocked(saveBlogNote).mockRejectedValue(failure)

    await expect(submitBlogNote('failed-save', formData)).rejects.toBe(failure)
    expect(getBlogNotes).not.toHaveBeenCalled()
  })
})
