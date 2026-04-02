import { describe, expect, it } from 'vite-plus/test'
import { pageRoutes } from '@/page-routes.generated.ts'
import { toHrefString } from '@/framework/page-routes.ts'

describe('page-routes', () => {
  it('builds encoded hrefs for dynamic page routes', () => {
    expect(toHrefString(pageRoutes.blogSlug.href({ slug: 'hello world' }))).toBe(
      '/blog/hello%20world'
    )
  })

  it('appends loose search params to page hrefs', () => {
    expect(
      toHrefString(
        pageRoutes.about.href({
          search: {
            filter: ['alpha', 'beta'],
            hidden: null,
            tab: 'team'
          }
        })
      )
    ).toBe('/about?filter=alpha&filter=beta&tab=team')
  })
})
