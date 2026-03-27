export type ProtectedActionState = {
  message: string
  status: 'error' | 'idle' | 'success'
}

export const initialProtectedActionState: ProtectedActionState = {
  message: '',
  status: 'idle'
}
