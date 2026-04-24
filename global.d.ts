declare module '*.css' {
  const css: string
  export default css
}

declare module '*.tsrx' {
  import type { ComponentType } from 'react'

  const component: ComponentType<any>
  export default component
}
