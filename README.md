# Vite + RSC + Nitro

This is a minimal React 19 starter that keeps low-level React Server Components on top of Vite+
while using Nitro as the HTTP runtime. The app still resolves pages from `src/routes/**/page.tsx`,
but Nitro now owns document requests, internal RSC endpoints, and the production server output.

This setup combines:

- [React Server Components](https://react.dev/reference/rsc/server-components)
- [`@vitejs/plugin-rsc`](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-rsc)
- [Nitro](https://nitro.build/)
- [Vite+](https://vite.plus/)

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/vitejs/vite-plugin-react/tree/main/packages/plugin-rsc/examples/starter)

## Commands

Use Vite+ commands directly with `vp` aliases if that is how your local environment is configured.

```sh
# install dependencies and run vite+ config
vp install
vp config

# run the dev server
vp dev

# run formatting, linting, and type checks
vp check
vp fmt
vp lint

# run raw TypeScript checking only with TS 7 / tsgo
vp run typecheck

# run tests
vp test

# build for production and preview
vp build
vp preview
```

## Runtime Overview

Nitro fronts the app at the HTTP layer:

- document requests go through the Nitro renderer in [`server/renderer.ts`](./server/renderer.ts)
- client navigations and refreshes fetch `GET /_rsc/**`
- hydrated server actions post to `POST /_actions/:actionId`
- progressive enhancement form posts still submit to the page URL itself

The React rendering pipeline remains split across Vite environments:

- [`src/framework/entry.rsc.tsx`](./src/framework/entry.rsc.tsx)
  - normalizes Nitro requests
  - executes server actions
  - renders the React Flight payload
- [`src/framework/entry.ssr.tsx`](./src/framework/entry.ssr.tsx)
  - renders HTML from the RSC stream
  - injects the initial Flight payload for hydration
- [`src/framework/entry.browser.tsx`](./src/framework/entry.browser.tsx)
  - hydrates the page
  - re-fetches RSC payloads from Nitro endpoints

Nitro configuration lives in:

- [`nitro.config.ts`](./nitro.config.ts)
- [`server/renderer.ts`](./server/renderer.ts)
- [`server/routes/_rsc`](./server/routes/_rsc)
- [`server/routes/_actions`](./server/routes/_actions)

## API Usage

See
[`@vitejs/plugin-rsc`](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-rsc)
for the underlying RSC documentation.

- [`vite.config.ts`](./vite.config.ts)
  - `@vitejs/plugin-rsc/plugin`
  - `nitro/vite`
- [`src/framework/entry.rsc.tsx`](./src/framework/entry.rsc.tsx)
  - `@vitejs/plugin-rsc/rsc`
  - `import.meta.viteRsc.loadModule`
- [`src/framework/entry.ssr.tsx`](./src/framework/entry.ssr.tsx)
  - `@vitejs/plugin-rsc/ssr`
  - `import.meta.viteRsc.loadBootstrapScriptContent`
  - `rsc-html-stream/server`
- [`src/framework/entry.browser.tsx`](./src/framework/entry.browser.tsx)
  - `@vitejs/plugin-rsc/browser`
  - `rsc-html-stream/client`

## Notes

- [`src/framework/entry.{browser,rsc,ssr}.tsx`](./src/framework) provides the low-level RSC
  integration points with inline comments.
- See [`docs/ROUTING.md`](./docs/ROUTING.md) for the full routing guide, including page modules,
  Nitro endpoints, and client navigation behavior.
- This repo uses `@typescript/native-preview`, so plain type checking runs through TS 7 / `tsgo` via
  `vp run typecheck` or `vp exec tsgo --noEmit`.
- Keep `src/features` organized by feature folder, such as `src/features/starter/app-store.tsx`,
  instead of adding flat files directly under `src/features`.
- Dynamic routes are supported through folder names like `src/routes/blog/[slug]/page.tsx`, which
  maps to `/blog/:slug` paths such as `/blog/example-slug`.
- Nitro v3 is currently beta in this setup. The app is planned and validated against the Node server
  runtime first.

## Build Output

The app no longer uses manual client chunk groups. Client chunking is left to Vite/Rolldown's
default behavior, while Nitro handles server route chunking and final runtime packaging.

Production build output now lives under:

- `.output/public` for browser assets
- `.output/server/index.mjs` for the standalone Node server

The RSC and SSR Vite service bundles used by Nitro are generated under `node_modules/.nitro/vite`.

## Deployment

Node-first deployment is the supported default:

```sh
vp build
node .output/server/index.mjs
```

The provided `Dockerfile` now runs the Nitro server entry directly.
