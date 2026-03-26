export type BlogActionState = {
  message: string
  status: 'idle' | 'error' | 'success'
}

export const initialBlogActionState: BlogActionState = {
  message: '',
  status: 'idle'
}
