import { expectTypeOf, it } from 'vite-plus/test'
import type { RouteOptions } from 'void/routes'
import type { AppRouter } from '@/framework/navigation'
import type { Link } from '@/framework/navigation/link.tsx'

it('checks destinations against the generated route types', () => {
  type LinkHref = Parameters<typeof Link>[0]['href']
  type RouterHref = Parameters<AppRouter['push']>[0]

  expectTypeOf<
    | '/'
    | '/about'
    | '/blog/example-slug?view=full#notes'
    | '/api/demo/request'
    | 'https://void.cloud'
  >().toExtend<LinkHref>()
  expectTypeOf<'/abuot'>().not.toExtend<LinkHref>()

  expectTypeOf<'/dashboard' | '?view=full' | '#notes'>().toExtend<RouterHref>()
  expectTypeOf<'/dashbaord'>().not.toExtend<RouterHref>()
  expectTypeOf<'https://void.cloud'>().not.toExtend<RouterHref>()
  expectTypeOf<AppRouter['replace']>().toEqualTypeOf<AppRouter['push']>()

  expectTypeOf<{ params: { slug: string } }>().toExtend<RouteOptions<'/blog/[slug]'>>()
  expectTypeOf<{ query: { view: string } }>().not.toExtend<RouteOptions<'/blog/[slug]'>>()
  expectTypeOf<{ params: { id: string } }>().not.toExtend<RouteOptions<'/blog/[slug]'>>()
})
