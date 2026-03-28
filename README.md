# Vite + RSC

This is a minimal react boilerplate that doesn't use a framework. Just react 19, vite (vite+), and
rsc (server components)

This example shows how to set up a React application with
[Server Component](https://react.dev/reference/rsc/server-components) features on Vite using
[`@vitejs/plugin-rsc`](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-rsc).

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/vitejs/vite-plugin-react/tree/main/packages/plugin-rsc/examples/starter)

## Commands

Use Vite+ commands directly with `vp` aliases if that is how your local environment is configured.

```sh
# install dependencies and run vite+ confg
vp install
vp confg

# run the dev server
vp dev

# run formatting, linting, and type checks
vp check
vp fmt
vp lint

# run raw TypeScript checking only with TS 7 / tsgo
vp run typecheck

# or invoke tsgo directly
vp exec tsgo --noEmit

# remove @typescript/native-preview to fall back to built-in tsc (TS 5)
# then use:
vp exec tsc --noEmit

# run tests
vp test

# build for production and preview
vp build
vp preview
```

## API usage

See
[`@vitejs/plugin-rsc`](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-rsc)
for the documentation.

- [`vite.config.ts`](./vite.config.ts)
  - `@vitejs/plugin-rsc/plugin`
- [`./src/framework/entry.rsc.tsx`](./src/framework/entry.rsc.tsx)
  - `@vitejs/plugin-rsc/rsc`
  - `import.meta.viteRsc.loadModule`
- [`./src/framework/entry.ssr.tsx`](./src/framework/entry.ssr.tsx)
  - `@vitejs/plugin-rsc/ssr`
  - `import.meta.viteRsc.loadBootstrapScriptContent`
  - `rsc-html-stream/server`
- [`./src/framework/entry.browser.tsx`](./src/framework/entry.browser.tsx)
  - `@vitejs/plugin-rsc/browser`
  - `rsc-html-stream/client`

## Notes

- [`./src/framework/entry.{browser,rsc,ssr}.tsx`](./src/framework) (with inline comments) provides
  an overview of how low level RSC (React flight) API can be used to build RSC framework.
- See [`./docs/ROUTING.md`](./docs/ROUTING.md) for the full routing guide, including file-based
  route conventions, server page props, client navigation hooks, and examples.
- You can use [`vite-plugin-inspect`](https://github.com/antfu-collective/vite-plugin-inspect) to
  understand how `"use client"` and `"use server"` directives are transformed internally.
- This repo uses `@typescript/native-preview`, so plain type checking runs through TS 7 / `tsgo` via
  `vp run typecheck` or `vp exec tsgo --noEmit`. Remove that package to fall back to built-in `tsc`
  on TS 5. Use `vp check` for the full format, lint, and typecheck pass.
- Keep `src/features` organized by feature folder, such as `src/features/starter/app-store.tsx`,
  instead of adding flat files directly under `src/features`.
- Dynamic routes are supported through folder names like `src/routes/blog/[slug]/page.tsx`, which
  maps to `/blog/:slug` paths such as `/blog/example-slug`.

## Code Splitting

The client build uses Rolldown's `codeSplitting` to break the single client bundle into smaller,
cacheable chunks. This keeps initial page loads fast and ensures users only download the JavaScript
needed for the current route.

### Current chunk layout

| Chunk       | Contents                                        | When loaded                           |
| ----------- | ----------------------------------------------- | ------------------------------------- |
| `react`     | `react`, `react-dom`                            | Every page (cached long-term)         |
| `shared-ui` | `tailwind-merge`, `clsx`, `cn()`, UI primitives | Pages using interactive UI components |
| `feature-*` | Per-feature `'use client'` components           | Only when the route needs them        |
| `index`     | Framework bootstrap, navigation, error boundary | Every page                            |

### Adding a new feature with client components

Just create client components in `src/features/<name>/` with a `'use client'` directive. The
`codeSplittingGroups()` function in `vite.config.ts` scans `src/features/` at build time and
generates a `feature-<name>` chunk automatically. No manual config needed.

### Adding a shared dependency used by client components

If a new package is imported by multiple `'use client'` components across features, add it to the
`shared-ui` regex in `codeSplittingGroups()` so it gets its own cacheable chunk instead of being
inlined into the first feature that imports it.

### Server bundle notes

Server bundles (RSC and SSR) are also optimized in `vite.config.ts` with `process.env.NODE_ENV`
defines and minification enabled. See `CLAUDE.md` for details on those optimizations and rules for
keeping bundles small.

## Deployment

See [vite-plugin-rsc-deploy-example](https://github.com/hi-ogawa/vite-plugin-rsc-deploy-example)
