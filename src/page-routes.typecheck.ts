import { pageRoutes } from '@/page-routes.generated.ts'
import type { PageProps } from '@/router.tsx'

const aboutHref = pageRoutes.about.href({ search: { tab: 'team' } })
const blogHref = pageRoutes.blogSlug.href({ slug: 'alpha-123' })

void aboutHref
void blogHref

declare const blogPageProps: PageProps<'/blog/[slug]'>

void blogPageProps.params.slug

// @ts-expect-error missing slug param
pageRoutes.blogSlug.href({})

// @ts-expect-error invalid param name
pageRoutes.blogSlug.href({ id: 'alpha-123' })

// @ts-expect-error static page routes do not accept path params
pageRoutes.about.href({ slug: 'alpha-123' })

// @ts-expect-error unknown route key
void pageRoutes.missing

// @ts-expect-error blog route props do not expose unknown params
void blogPageProps.params.postId

export {}
