# Routing

This project uses a custom file-based router built directly on top of the current React Server
Components setup, with Nitro handling the outer HTTP runtime. It does not use React Router, TanStack
Router, or Next.js routing primitives.

The routing system has three parts:

- Nitro route handlers and a Nitro renderer that own the external HTTP contract
- Nitro middleware and plugins that can run before or around route handling
- A server-side file matcher that resolves `src/routes/**/page.tsx` to URLs
- A small client navigation layer that updates the browser URL and triggers a new RSC fetch

## Overview

The key pieces are:

- `server/renderer.ts`
  - Handles document requests through Nitro
- `server/routes/_rsc`
  - Serves internal RSC payload requests
- `server/routes/_actions`
  - Serves hydrated server action requests
- `server/middleware`
  - Runs Nitro middleware before routes and page rendering
- `server/plugins`
  - Runs Nitro app hooks such as request and response logging
- `src/router.tsx`
  - Builds the route table from the filesystem with `import.meta.glob()`
  - Matches static and dynamic segments
- `src/root.tsx`
  - Calls `resolveRoute(url)` and renders the matched page
  - Falls back to the built-in 404 page when nothing matches
- `src/framework/entry.rsc.tsx`
  - Normalizes Nitro requests and renders the app for both SSR and RSC responses
- `src/framework/entry.browser.tsx`
  - Hydrates the app in the browser
  - Re-fetches the RSC payload after navigation and refreshes
- `src/framework/navigation/index.ts`
  - Exposes client hooks like `useRouter()`, `usePathname()`, and `useSearchParams()`

## File-Based Route Conventions

Routes are defined by files under `src/routes`.

Examples:

```text
src/routes/page.tsx                -> /
src/routes/about/page.tsx          -> /about
src/routes/blog/[slug]/page.tsx    -> /blog/:slug
```

Rules:

- Every route module must be named `page.tsx`
- Folder names become URL segments
- Dynamic segments use `[param]`
- There is no separate route config file
- There are currently no catch-all segments, optional segments, layouts, or route groups

Static routes are matched before dynamic routes at the same level, so a literal segment wins over
`[param]`.

## Route Module Contract

Route modules export a default component. The router passes:

```ts
type PageProps = {
  params: Record<string, string>
  url: URL
}
```

You can import `PageProps` from `@/router.tsx` when you want the explicit type:

```tsx
import type { PageProps } from '@/router.tsx'

export default function BlogPage(props: PageProps) {
  return <h1>{props.params.slug}</h1>
}
```

Notes:

- `params` contains decoded dynamic route params
- `url` is the full request URL for the current render
- Page modules may be sync or async server components

### Static Route Example

```tsx
export default function AboutPage() {
  return <h1>About</h1>
}
```

### Dynamic Route Example

```tsx
import type { PageProps } from '@/router.tsx'

export default function BlogPage(props: PageProps) {
  const { slug } = props.params
  const view = props.url.searchParams.get('view')

  return (
    <>
      <h1>{slug}</h1>
      <p>Current view: {view ?? 'default'}</p>
    </>
  )
}
```

## How Requests Flow

### Initial Page Load

1. The browser requests a normal URL like `/about`
2. Nitro runs matching middleware in `server/middleware/**`
3. Nitro forwards the request to `server/renderer.ts`
4. The SSR Vite service delegates to the RSC Vite service
5. `src/framework/entry.rsc.tsx` normalizes the request and starts the render
6. `src/root.tsx` calls `resolveRoute(url)`
7. `src/router.tsx` matches the URL against `src/routes/**/page.tsx`
8. The matched page is rendered as RSC, then wrapped into HTML for SSR
9. The browser hydrates using `src/framework/entry.browser.tsx`

### Client Navigation

On the client, navigation does not do a full document reload for same-origin links.

The browser entry:

- intercepts same-origin `<a href="...">` clicks
- patches `history.pushState()` and `history.replaceState()`
- listens for `popstate`
- requests a fresh RSC payload from `/_rsc/**` for the new URL

That means these all work as navigation:

- clicking a normal same-origin link
- `router.push('/about')`
- `router.replace('/about?tab=team')`
- using the browser back and forward buttons

### Refreshing the Current Route

`router.refresh()` does not reload the whole document. It re-fetches the current route through
Nitro's internal `/_rsc/**` endpoint and re-renders the page with the current URL.

Use it when you want to re-run the current server render after a mutation or any other invalidation.

## Reading Route State on the Server

Server route modules receive the current URL through `PageProps`.

Examples:

```tsx
export default function SearchPage(props: PageProps) {
  const query = props.url.searchParams.get('q')
  const pathname = props.url.pathname

  return (
    <>
      <p>{pathname}</p>
      <p>{query}</p>
    </>
  )
}
```

This is the source of truth for route data in server components.

## Reading and Updating Route State on the Client

Client components can use the hooks in `src/framework/navigation/index.ts`.

### `useRouter()`

```tsx
'use client'

import { useRouter } from '@/framework/navigation'

export function Toolbar() {
  const router = useRouter()

  return (
    <div>
      <button type="button" onClick={() => router.push('/about')}>
        Go to about
      </button>
      <button type="button" onClick={() => router.replace('/about?tab=team')}>
        Replace URL
      </button>
      <button type="button" onClick={() => router.refresh()}>
        Refresh route
      </button>
    </div>
  )
}
```

Available methods:

- `router.push(href)`
- `router.replace(href)`
- `router.refresh()`
- `router.back()`
- `router.forward()`

Notes:

- `useRouter()` is client-only and must be used from a `'use client'` module
- There is currently no `router.redirect()`
- There is currently no route prefetch API

## Internal Endpoints

Nitro exposes two internal endpoints for the React runtime:

- `GET /_rsc/**`
  - Used for client-side navigation and refresh
- `POST /_actions/:actionId`
  - Used for hydrated server actions

Progressive enhancement form submissions still post to the page URL itself, so the server can
re-render the document response without JavaScript.

## Nitro Middleware and Plugins

Nitro can do work before page rendering without changing the React route-module contract.

### Request Logging Demo

This repo includes a Nitro request logger in `server/plugins/request-logger.ts`.

It uses Nitro's request and response hooks to print one log line for:

- page requests such as `/`, `/about`, and `/dashboard`
- API requests such as `/api/demo/request`

It intentionally skips internal React runtime endpoints like `/_rsc/**` and `/_actions/:actionId` so
the logs stay focused on user-facing page and API traffic.

### Auth Before Rendering a Page Route

This repo also includes a Nitro auth gate in `server/middleware/01.page-auth.ts`.

The middleware:

- checks whether the request pathname matches `/dashboard`
- reads the demo auth cookie
- redirects to `/login?redirect=...` before the page route renders when the cookie is missing

Because this happens in Nitro middleware, the protected page route is blocked before the React
server component tree renders.

Related demo files:

- `src/routes/login/page.tsx`
  - Simple page that posts to the Nitro login handler
- `src/routes/dashboard/page.tsx`
  - Protected page route
- `server/routes/auth/login.post.ts`
  - Sets the demo auth cookie and redirects back
- `server/routes/auth/logout.post.ts`
  - Clears the demo auth cookie

### API Demo Route

The repo includes `server/routes/api/demo/request.get.ts` as a small Nitro API route. It returns a
JSON payload with the request path, method, timestamp, and whether the demo auth cookie is present.

That gives you a visible API target to pair with the request logger.

### `usePathname()`

```tsx
'use client'

import { usePathname } from '@/framework/navigation'

export function CurrentPath() {
  const pathname = usePathname()

  return <span>{pathname}</span>
}
```

This updates after:

- link clicks
- `router.push()`
- `router.replace()`
- browser back and forward

### `useSearchParams()`

```tsx
'use client'

import { useSearchParams } from '@/framework/navigation'

export function ViewMode() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view')

  return <span>{view ?? 'default'}</span>
}
```

`useSearchParams()` returns a read-only `URLSearchParams`-style value. Read from it with methods
like:

- `get()`
- `getAll()`
- `has()`
- `entries()`
- `keys()`
- `values()`
- `toString()`

Do not mutate it directly. Update the URL with `router.push()` or `router.replace()` instead.

## Navigation Patterns

### Use Normal Links When You Can

For most navigation, use plain anchors:

```tsx
<a href="/about">About</a>
```

This preserves normal browser behavior and still uses client-side navigation for same-origin links.

### Use `useRouter()` for Non-Link Interactions

Use the router hook for buttons, menus, keyboard shortcuts, or other imperative transitions:

```tsx
'use client'

import { useRouter } from '@/framework/navigation'

export function OpenPostButton(props: { slug: string }) {
  const router = useRouter()

  return (
    <button type="button" onClick={() => router.push(`/blog/${props.slug}`)}>
      Open post
    </button>
  )
}
```

## 404 Behavior

If no file-based route matches the requested pathname, `src/root.tsx` renders the built-in not-found
page.

There is currently no custom per-route 404 module or nested not-found handling. The router resolves
either:

- a matched page module
- the shared fallback not-found UI

## Current Limitations

This routing system is intentionally small. At the moment it does not include:

- nested layout files
- route loaders or route actions as a separate routing API
- catch-all routes
- route groups
- redirect helpers
- prefetch APIs
- scroll restoration controls

If you need these later, add them on top of the current architecture instead of introducing a second
router by default.

## Quick Reference

- Add a new route by creating `src/routes/.../page.tsx`
- Read route params and query strings in server pages through `PageProps`
- Use plain `<a href>` for normal navigation
- Use `useRouter()` only in client components for imperative navigation
- Use `usePathname()` and `useSearchParams()` for client-side reads
- Use `router.refresh()` to re-run the current RSC render without a full page reload
