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

Install `vp` from the [Vite+ site](https://viteplus.dev/) before running project commands:

```sh
curl -fsSL https://vite.plus | bash
```

Use Vite+ commands directly with `vp` when running on the host. For dependency isolation, prefer the
Docker sandbox workflow below.

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

# run tests
vp test

# build for production and preview
vp build
vp preview
```

## Docker Dependency Sandbox

Prefer running package installs and dependency-backed commands in Docker when working with untrusted
or newly updated npm packages. The Compose dev profile keeps `node_modules` and generated output in
Docker volumes, mounts this repo read-only, disables install lifecycle scripts, and serves the app
on a Docker internal network with only `127.0.0.1:3000` exposed to the host.

```sh
# install dependencies into the Docker node_modules volume and start dev
docker compose --profile dev up dev

# run dependency-backed checks without outbound network access
docker compose --profile dev run --rm sandbox vp check
docker compose --profile dev run --rm sandbox vp test

# refresh the sandboxed node_modules volume after lockfile changes
docker compose --profile dev run --rm dev-deps
```

The first dependency install still needs registry network access, but `bunfig.toml` and the Compose
command both keep lifecycle scripts disabled. After dependencies are installed, use the `sandbox`
service for commands that do not need the network. This does not make npm packages trustworthy, but
it reduces the chance that package code can write to the host checkout, persist in host
`node_modules`, or exfiltrate over the network during normal checks and tests.

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
- The original base for this repo was scaffolded with `vp create vite` using the `React` -> `RSC`
  options.
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
