# Vite + RSC + Void

A React 19 starter that combines low-level React Server Components, Vite+, and
[Void](https://void.cloud) on Cloudflare Workers. Pages still resolve from
`src/routes/**/page.tsx`; Void owns the HTTP runtime, API routes, middleware, and D1 database.

The starter includes client navigation, server actions with progressive enhancement, a demo login
cookie, request logging, a typed posts API, and persistent notes on dynamic blog pages.

## Setup and commands

Install `vp` from the [Vite+ site](https://viteplus.dev/) before running host commands:

```sh
curl -fsSL https://vite.plus | bash
vp install
cp void.config.example.ts void.config.ts
vp exec void prepare
vp dev
```

Copy the public config example once on a fresh checkout; keep an existing local config when
updating. Run `vp exec void prepare` after a fresh checkout or dependency update. `bunfig.toml` disables
install lifecycle scripts, so installation alone does not generate Void's `.void/` types.
Development applies pending local D1 migrations automatically.

```sh
vp check
vp test run
vp run test:e2e
vp run build-storybook
vp run test:storybook
vp build
vp exec void db migrate
vp preview
```

The browser checks require Playwright's Chromium browser (`vp exec playwright install chromium`).
`vp preview` runs the built Cloudflare Worker locally. Apply local migrations first when previewing
from a fresh checkout. Production uses Cloudflare, including D1.

## Docker dependency sandbox

Prefer Docker when installing or checking unfamiliar dependencies. The dev services mount the
checkout read-only at `/source`, copy configuration into a writable container worktree, and mount
source directories read-only for HMR. Dependencies, generated types, local D1 state, and build
output use Docker volumes. The container root is read-only and install lifecycle scripts stay
disabled.

```sh
# Install dependencies, generate Void types, and start dev on localhost:3000.
docker compose --profile dev up --build dev

# Run checks without outbound network access after dependencies are installed.
docker compose --profile dev run --rm sandbox vp check
docker compose --profile dev run --rm sandbox vp test run
docker compose --profile dev run --rm sandbox vp build

# Refresh dependencies and generated types after lockfile changes.
docker compose --profile dev run --rm dev-deps

# Build and preview the Worker locally; this does not deploy it.
docker compose --profile preview up --build preview
```

The dependency-install service needs registry access. Dev runs on an internal Docker network; a
small TCP relay exposes only `127.0.0.1:3000` to the browser, including HMR. The sandbox service has
no network. Restart dev after changing root
configuration or scripts, and rebuild the image after changing the Docker entrypoint. Source edits
under `src`, `routes`, `middleware`, `server`, `db`, `public`, and `.storybook` are visible live.
Keep the `dev-void` and `dev-wrangler` volumes to retain local D1 data.

## Runtime and routing

Void middleware handles authorization, logging, document requests, `GET /_rsc/**` navigation, and
`POST /_actions/:actionId` server actions. Forms without JavaScript post to the page URL and receive
a new HTML document. Internal RSC/action responses use `Cache-Control: no-store`.

The rendering environments remain separate:

- `src/framework/entry.rsc.tsx` executes server actions and creates the React Flight stream.
- `src/framework/entry.ssr.tsx` turns Flight into HTML and embeds the initial hydration payload.
- `src/framework/entry.browser.tsx` hydrates, navigates, and refreshes the current route.
- `src/main.ssr.ts` and `src/main.client.ts` connect those entries to Void.

`vite.config.ts` registers `rsc` and `ssr` as children of Void's `void_worker` Cloudflare environment.
The committed Bun patch for **Void 1.1.11** exposes `workerChildEnvironments` and preserves those
environments during configuration. Review the patch before upgrading Void; `vp install` applies it
from `patches/`.

See [`docs/ROUTING.md`](./docs/ROUTING.md) for route modules, middleware, and navigation hooks, and
[`@vitejs/plugin-rsc`](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-rsc)
for the underlying RSC APIs. Feature code belongs in dedicated folders under `src/features`.

## Data and typed API demo

`db/schema.ts` defines the posts and blog notes tables. The generated `routes/api/posts.ts` route and
`src/demo.ts` demonstrate schema-to-handler-to-client type safety. Blog notes persist in D1 and keep
the newest five notes per slug. Notes from the previous in-memory demo cannot be recovered after
its process exits.

After changing the schema, generate and review an additive migration:

```sh
vp exec void db generate
```

Commit the migration files. Dev applies pending migrations locally; Void deploy applies them to
production. Existing posts and notes remain intact when applying additive migrations.

## Build and deployment

Build output lives in `dist/client` for browser assets and `dist/ssr` for the Worker, including the
RSC and SSR bundles in `dist/ssr/rsc` and `dist/ssr/render`. Preview with `vp preview`.

Cloudflare deployment reads your private account and Worker settings from the ignored
`void.config.ts`. The ignored `void.lock.json` preserves resource identities for later deployments
from that checkout:

```sh
vp exec void deploy --platform cloudflare
```

The GitHub workflow copies the public config example, then checks and tests pushes to `main` before
Void's readiness-gated deploy. Configure the scoped `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` repository secrets. Store the complete private `void.lock.json` content in a
`VOID_LOCK_JSON` repository secret so CI reuses the existing resource IDs. Deployment stops when
the account or lock secret is missing. Deploy locally first to provision resources, then save the
resulting lock in the secret; update that secret whenever a later deployment changes the lock. Set
`CLOUDFLARE_WORKERS_SUBDOMAIN` when the Worker has no version preview URL; Access-protected readiness
checks also need `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET`. D1 does not require
`DATABASE_URL`.

Keep `void.config.ts` and `void.lock.json` private. Back up the local lock and copy it securely when
moving a deployment to another checkout so Void can reuse its resources. Docker images use the
public config example and exclude both private files. Commit `void.config.example.ts`, `bun.lock`,
and the dependency patch. Void's generated `.void/`, `.void-wrangler.jsonc`, and `.wrangler/` also stay
out of Git.

## Graphify

See [`docs/GRAPHIFY.md`](./docs/GRAPHIFY.md) for optional local knowledge-graph setup. Install it with
`pip install graphifyy`, then refresh with `vp run graphify:update`.
