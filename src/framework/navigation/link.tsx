import type { ComponentProps } from 'react'
import type { Href } from 'void/routes'

export function Link(props: Omit<ComponentProps<'a'>, 'href'> & { href: Href }) {
  return <a {...props} />
}
