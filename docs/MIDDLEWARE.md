# Middleware

This project supports flat, route-based middleware on top of the custom file router.

The middleware layer is implemented in the request entry, not inside page components. That keeps
auth guards and request-scoped loaders consistent across:

- initial SSR document requests
- client-side RSC navigations
- hydrated server action requests
- progressive-enhancement form posts

## Request Lifecycle

The current flow is:

1. `src/framework/entry.rsc.tsx` parses the incoming request.
2. The request URL is matched against `src/routes/**/page.tsx`.
3. Route middleware runs before any route-scoped server action work.
4. If the request is a server action and middleware allows it, the action runs.
5. Middleware runs again before the follow-up page render for action requests.
6. The matched page receives `url`, `params`, and `context`.
7. The page is serialized as RSC and optionally wrapped into HTML for SSR.

The middleware contract is intentionally small. There are no nested layouts, route groups, rewrites,
or proxy semantics in v1.

## Route Module API

Route modules can export `middleware` alongside the default page export:

```tsx
import type { PageProps, RouteMiddleware } from '@/router.tsx'
import { redirect } from '@/framework/middleware.ts'

const requireAuth: RouteMiddleware = ({ context, request, requestKind, url }) => {
  const hasSession = request.headers.get('cookie')?.includes('demo-session=')
  if (!hasSession) {
    const next = `${url.pathname}${url.search}`
    return redirect(`/login?next=${encodeURIComponent(next)}`, requestKind === 'action' ? 303 : 302)
  }

  context.viewer = { role: 'member' }
}

export const middleware = [requireAuth]

export default function ProtectedPage(props: PageProps) {
  return <pre>{JSON.stringify(props.context.viewer)}</pre>
}
```

The relevant types are:

```ts
type RequestKind = 'ssr' | 'rsc' | 'action'

type RouteMiddlewareArgs = {
  context: Record<string, unknown>
  params: Record<string, string>
  request: Request
  requestKind: RequestKind
  url: URL
}

type RouteRedirect = {
  type: 'redirect'
  location: string
  status?: 301 | 302 | 303 | 307 | 308
}

type RouteMiddlewareResult = void | Response | RouteRedirect
type RouteMiddleware = (
  args: RouteMiddlewareArgs
) => RouteMiddlewareResult | Promise<RouteMiddlewareResult>
```

## Context

`context` is a per-request mutable object created by the middleware runner and passed directly to
the page component:

```ts
type PageProps = {
  context: Record<string, unknown>
  params: Record<string, string>
  url: URL
}
```

Use helper functions around `context` when you want route code to stay type-safe:

```ts
export function getSessionFromContext(context: Record<string, unknown>) {
  const value = context.session
  return typeof value === 'object' && value ? value : null
}
```

## Redirect Behavior

Redirect handling differs by request type:

- `ssr`: middleware returns a normal HTTP redirect response.
- `rsc`: middleware returns an explicit redirect signal header. The browser entry calls
  `replaceState()` and re-fetches the destination route as RSC.
- `action`: progressive-enhancement form posts receive a normal HTTP redirect; hydrated action
  fetches use the same explicit redirect signal as RSC navigations.

This avoids handing HTML redirects to `createFromFetch()`, which expects an RSC payload.

Non-redirect terminal `Response` values are best reserved for SSR or progressive-enhancement
requests. Client-side RSC fetches only special-case redirects.

## Examples

### Auth Guard

The demo route at `src/routes/protected/page.tsx` uses:

- `requireDemoSession`
- `addProtectedGreeting`

The first middleware checks for `demo-session=<user>` in the request cookies and redirects to
`/login` when it is missing. The second middleware adds a greeting to `context` for the page render.

### Request-Scoped Loader

Middleware can also act like a loader for page-only data:

```ts
import type { RouteMiddleware } from '@/router.tsx'

export const loadRequestMeta: RouteMiddleware = ({ context, request, url }) => {
  context.requestMeta = {
    pathname: url.pathname,
    userAgent: request.headers.get('user-agent') ?? 'unknown'
  }
}
```

The page can then read `props.context.requestMeta`.

## Limitations

- Middleware is leaf-route only in v1.
- There are no layout-level middleware chains.
- There are no rewrites or proxy hooks.
- Middleware should not consume the request body. Route matching, auth checks, and header/cookie
  reads are the intended use cases.
