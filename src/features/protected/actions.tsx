'use server'

import { submitProtectedNote } from '@/features/protected/service.ts'
import type { ProtectedActionState } from '@/features/protected/state.ts'

export async function addProtectedNote(
  _previousState: ProtectedActionState,
  formData: FormData
): Promise<ProtectedActionState> {
  return submitProtectedNote(formData)
}
