import type { ComponentPropsWithoutRef } from 'react'
import { toHrefString, type RouteHref } from '@/framework/page-routes.ts'

type PageLinkProps<P extends string> = Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
  href: RouteHref<P>
}

export function PageLink<P extends string>(props: PageLinkProps<P>) {
  const { href, ...anchorProps } = props

  return <a {...anchorProps} data-route-link="" href={toHrefString(href)} />
}
