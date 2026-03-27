import { AppShell } from '@/components/app-shell.tsx'
import { resolveRoute, type MatchedRoute, type RouteContext } from '@/router.tsx'
import './index.css'

export async function Root(props: { context: RouteContext; match: MatchedRoute | null; url: URL }) {
  const page = await renderPage(props.match, props.url, props.context)

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>React RSC Starter</title>
      </head>
      <body>
        <AppShell pathname={props.url.pathname}>{page}</AppShell>
      </body>
    </html>
  )
}

async function renderPage(match: MatchedRoute | null, url: URL, context: RouteContext) {
  if (!match) {
    return <NotFoundPage url={url} />
  }

  return await match.module.default({ context, url, params: match.params })
}

function NotFoundPage(props: { url: URL }) {
  return (
    <section className="grid gap-6">
      <p className="m-0 text-sm font-bold uppercase tracking-[0.2em] text-primary">404</p>
      <div className="grid gap-4">
        <h1 className="m-0 text-4xl leading-none font-semibold tracking-tight sm:text-5xl">
          Page not found.
        </h1>
        <p className="m-0 max-w-3xl text-lg leading-8 text-muted-foreground">
          No route is registered for <code>{props.url.pathname}</code>.
        </p>
      </div>

      <div className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-[0_18px_50px_rgba(17,24,39,0.08)] backdrop-blur">
        <p className="m-0 mb-4 text-base text-foreground">
          Add or rename files in <code>src/routes</code> to extend the route map.
        </p>
        <a
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Back home
        </a>
      </div>
    </section>
  )
}

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest
  const { renderToStaticMarkup } = await import('react-dom/server')

  describe('Root', () => {
    it('renders the home route with hydrated starter state', async () => {
      const url = new URL('https://example.com/')
      const html = renderToStaticMarkup(await Root({ context: {}, match: resolveRoute(url), url }))

      expect(html).toContain('Minimal React RSC boilerplate for Vite Plus.')
      expect(html).toContain('Hello from your React RSC starter.')
      expect(html).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
    })

    it('renders the not found route for unknown paths', async () => {
      const url = new URL('https://example.com/missing')
      const html = renderToStaticMarkup(await Root({ context: {}, match: resolveRoute(url), url }))

      expect(html).toContain('Page not found.')
      expect(html).toContain('/missing')
    })
  })
}
