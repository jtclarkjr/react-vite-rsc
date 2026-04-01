import type { ReactNode } from 'react'
import type { ReactFormState } from 'react-dom/client'

export type RscPayload = {
  root: ReactNode
  returnValue?: { ok: boolean; data: unknown }
  formState?: ReactFormState
}
