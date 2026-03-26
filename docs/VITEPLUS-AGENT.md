<!-- below is what vite+ generates when creating a vp app for agent files: -->

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown,
Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend
tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, but it invokes Vite through
`vp dev` and `vp build`.

## Vite+ Workflow

`vp` is a global binary that handles the full development lifecycle. Run `vp help` to print a list
of commands and `vp <command> --help` for information about a specific command.

### Start

- create - Create a new project from a template
- migrate - Migrate an existing project to Vite+
- config - Configure hooks and agent integration
- staged - Run linters on staged files
- install (`i`) - Install dependencies
- env - Manage Node.js versions

### Develop

- dev - Run the development server
- check - Run format, lint, and TypeScript type checks
- lint - Lint code
- fmt - Format code
- test - Run tests

### Execute

- run - Run monorepo tasks
- exec - Execute a command from local `node_modules/.bin`
- dlx - Execute a package binary without installing it as a dependency
- cache - Manage the task cache

### Build

- build - Build for production
- pack - Build libraries
- preview - Preview production build

### Manage Dependencies

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn
through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- add - Add packages to dependencies
- remove (`rm`, `un`, `uninstall`) - Remove packages from dependencies
- update (`up`) - Update packages to latest versions
- dedupe - Deduplicate dependencies
- outdated - Check for outdated packages
- list (`ls`) - List installed packages
- why (`explain`) - Show why a package is installed
- info (`view`, `show`) - View package information from the registry
- link (`ln`) / unlink - Manage local package links
- pm - Forward a command to the package manager

### Maintain

- upgrade - Update `vp` itself to the latest version

These commands map to their corresponding tools. For example, `vp dev --port 3000` runs Vite's dev
server and works the same as Vite. `vp test` runs JavaScript tests through the bundled Vitest. The
version of all tools can be checked using `vp --version`. This is useful when researching
documentation, features, and bugs.

## Common Pitfalls

- **Using the package manager directly:** Do not use pnpm, npm, or Yarn directly. Vite+ can handle
  all package manager operations.
- **Always use Vite commands to run tools:** Don't attempt to run `vp vitest` or `vp oxlint`. They
  do not exist. Use `vp test` and `vp lint` instead.
- **Running scripts:** Vite+ built-in commands (`vp dev`, `vp build`, `vp test`, etc.) always run
  the Vite+ built-in tool, not any `package.json` script of the same name. To run a custom script
  that shares a name with a built-in command, use `vp run <script>`. For example, if you have a
  custom `dev` script that runs multiple services concurrently, run it with `vp run dev`, not
  `vp dev` (which always starts Vite's dev server).
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must
  not be installed directly. You cannot upgrade these tools by installing their latest versions.
  Always use Vite+ commands.
- **Use Vite+ wrappers for one-off binaries:** Use `vp dlx` instead of package-manager-specific
  `dlx`/`npx` commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all
  modules should be imported from the project's `vite-plus` dependency. For example,
  `import { defineConfig } from 'vite-plus';` or
  `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test
  utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vp lint --type-aware`
  works out of the box.

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to validate changes.
<!--VITE PLUS END-->

# Architecture Overview

## Stack

- **Framework**: TanStack Start (file-based routing, SSR with hydration, no RSC)
- **Language**: TypeScript (`@typescript/native-preview` tsgo for type checking)
- **Runtime**: Bun (pnpm for package management)
- **Database/Auth**: Supabase (`@supabase/supabase-js` for both)
- **Data Fetching**: React Query + REST API routes (no tRPC)
- **Validation**: Zod schemas shared between client and server
- **Styling**: Tailwind v4 + shadcn/ui
- **Realtime**: Supabase Realtime (presence, broadcast, postgres changes)
- **Tooling**: Vite+ (oxlint + oxfmt)

## Setup

1. Copy `.env.example` to `.env` and fill in Supabase keys.
2. Run the SQL from `database/schema.sql` in the Supabase SQL editor.
3. Enable Realtime on `canvas_elements` table in Supabase dashboard.
4. Run `vp install` then `vp dev`.

## Environment Variables

- `SUPABASE_URL` / `SUPABASE_SECRET_KEY` — server-side (full DB access)
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` — browser client (auth
  - realtime)

## Deployment Notes

- **Cloudflare Containers env injection:** Pass runtime env into the container with the Container
  class `envVars` property or explicit start options. Do not assign secrets to `this.env` and expect
  them to appear inside the container.
- **Lazy server Supabase client creation:** Create the server Supabase client inside request
  handlers/server functions via a helper like `getSupabase()`. Avoid module-level
  `createClient(...)` when deployment env can be missing or injected late, because import-time
  failures show up as generic `HTTPError` 500s on API routes.

## Directory Structure

```
src/
├── features/canvas/
│   ├── canvas.schema.ts            # Zod schemas for canvas + element CRUD
│   ├── canvas.api.ts               # Typed fetch client (REST)
│   ├── canvas.query.ts             # React Query hooks + mutations
│   ├── canvas-list.page.tsx        # Home page: canvas grid
│   ├── canvas-workspace.page.tsx   # Canvas workspace wrapper
│   ├── lib/
│   │   ├── canvas-types.ts         # Tool, Point, Path, TextElement, Camera
│   │   ├── canvas-commands.ts      # Command types + factories + getInverseCommand
│   │   ├── apply-command.ts        # createApplyCommand
│   │   ├── drawing-utils.ts        # Pure utils (hit testing, SVG paths)
│   │   └── tools.ts               # Tool definitions with lucide-react icons
│   ├── hooks/
│   │   ├── use-canvas-elements.ts  # Data layer (React Query + Supabase realtime)
│   │   ├── use-realtime-cursors.ts # Presence + broadcast for live cursors
│   │   ├── use-drawing.ts          # Pencil tool
│   │   ├── use-text-editing.ts     # Text creation/editing/dragging
│   │   ├── use-element-selection.ts # Marquee selection
│   │   ├── use-element-dragging.ts # Multi-element drag
│   │   ├── use-canvas-keyboard-shortcuts.ts
│   │   ├── use-undo-redo.ts        # Command stack
│   │   └── use-double-click-detection.ts
│   └── components/
│       ├── canvas-dashboard.tsx     # Main orchestrator
│       ├── canvas-viewport.tsx      # Camera/pan/zoom
│       ├── drawing-layer.tsx        # Interaction hub wiring all hooks
│       ├── canvas-svg.tsx           # SVG container
│       ├── path-renderer.tsx        # Render drawn paths
│       ├── text-renderer.tsx        # Render text elements
│       ├── text-input-overlay.tsx   # Inline text editing input
│       ├── selection-rectangle.tsx  # Marquee selection
│       ├── canvas-toolbar.tsx       # Tool picker
│       ├── text-formatting-toolbar.tsx # Font controls
│       ├── canvas-action-toolbar.tsx   # Undo/redo/delete
│       ├── live-layer.tsx           # Other users' cursors
│       └── canvases-list.tsx        # Grid of canvas cards
├── features/auth/                   # Login/signup forms, auth status
├── routes/
│   ├── __root.tsx                   # Root layout, session + auth config
│   ├── index.tsx                    # Home: auth guard + CanvasListPage
│   ├── canvas.$canvasId.tsx         # Canvas workspace route
│   ├── login.tsx                    # Login page with auth redirect
│   └── api/
│       ├── canvases.ts              # GET (list), POST (create)
│       ├── canvases.$canvasId.ts    # PATCH (update), DELETE
│       ├── canvases.$canvasId.elements.ts      # GET (list), POST (upsert)
│       └── canvases.$canvasId.elements.$elementId.ts  # DELETE
├── lib/
│   ├── api-client.ts                # Shared ApiClientError + parseResponse
│   ├── auth-client.ts               # Supabase browser client + cookie sync
│   └── server/
│       ├── supabase.ts              # Server Supabase client (secret key)
│       ├── get-session.ts           # SSR session via createServerFn
│       ├── get-request-session.ts   # Session for API route handlers
│       ├── api-error.ts             # AppError, parseJsonBody, parseInput
│       └── auth-config.ts           # Auth configuration check
└── components/ui/                   # shadcn primitives
```

## Key Architectural Patterns

### API Layer (no tRPC)

REST API routes with Zod validation, following the pattern:

1. **Schema** (`canvas.schema.ts`): Zod input/output schemas + derived types
2. **API client** (`canvas.api.ts`): Typed fetch functions using shared `parseResponse` from
   `src/lib/api-client.ts`
3. **React Query** (`canvas.query.ts`): `queryOptions`, `useQuery`, `useMutation` hooks with cache
   invalidation
4. **Route handlers** (`src/routes/api/`): Server handlers using `parseJsonBody`, `parseInput`,
   Supabase queries, and schema validation on responses

### Auth Flow

1. User visits any protected route → `beforeLoad` checks `context.session`
2. No session → `throw redirect({ to: '/login' })`
3. User signs in → Supabase sets session → `onAuthStateChange` syncs to cookie
4. `await router.invalidate()` → root `beforeLoad` re-runs `getServerSession()` → reads cookie →
   session found → login route redirects to `/`
5. Sign out → cookie cleared → `router.invalidate()` → no session → redirects to `/login`

**Cookie sync** (`src/lib/auth-client.ts`): The Supabase JS client stores sessions in `localStorage`
by default. An `onAuthStateChange` listener writes the access token to a cookie
(`sb-{projectRef}-auth-token`) so the server-side `getServerSession` can read it. This is critical
for SSR auth guards.

### Supabase Client Architecture

- **Browser client** (`src/lib/auth-client.ts`): uses publishable key, handles auth + realtime
  subscriptions + cookie sync
- **Server client** (`src/lib/server/supabase.ts`): uses secret key for full database access in API
  routes
- **SSR session** (`src/lib/server/get-session.ts`): `createServerFn` that reads auth cookie from
  request headers
- **API route session** (`src/lib/server/get-request-session.ts`): plain function taking `Request`
  for use in route handlers

### Key rules

- Tables are managed in the Supabase dashboard — not in code.
- Do not install `drizzle-orm`, `better-auth`, or any other ORM/auth library.
- Use `SUPABASE_SECRET_KEY` for server-side access and `VITE_SUPABASE_PUBLISHABLE_KEY` for the
  browser client.

## Database Schema

Run `database/schema.sql` in Supabase SQL editor to set up the schema.

**canvases**

- `id` (uuid, PK, default `gen_random_uuid()`)
- `title` (text, not null, default `'Untitled'`)
- `created_by` (uuid, not null, references `auth.users`, cascade delete)
- `created_at` (timestamptz, not null, default `now()`)

**canvas_elements**

- `id` (uuid, PK, default `gen_random_uuid()`)
- `canvas_id` (uuid, not null, references `canvases`, cascade delete)
- `type` (text, not null) — `'path'` or `'text'`
- `data` (jsonb) — element-specific properties
- `x` (float8, not null, default 0)
- `y` (float8, not null, default 0)
- `z` (float8) — z-index for layering
- `updated_by` (uuid, references `auth.users`)
- `updated_at` (timestamptz, not null, default `now()`)

Index: `idx_canvas_elements_canvas_id` on `canvas_elements(canvas_id)` Realtime: `canvas_elements`
added to `supabase_realtime` publication

### Element Data Format

**Path** (`type: 'path'`): `data = { points: Point[], color: string, width: number }` Coordinates
stored at `x: 0, y: 0` (points contain absolute positions).

**Text** (`type: 'text'`): `data = { text, color, fontSize, isBold, isItalic, isUnderline }`
Position stored in `x`, `y` columns.

## Supabase Realtime

### Postgres Changes (Database Sync)

`use-canvas-elements.ts` subscribes to INSERT/UPDATE/DELETE on `canvas_elements` filtered by
`canvas_id`. Skips UPDATE events for the currently editing text element to prevent race conditions.

### Presence + Broadcast (Live Cursors)

`use-realtime-cursors.ts` uses a single channel per canvas room:

- **Presence**: tracks online users with `channel.track({ name, color })`
- **Broadcast**: sends cursor positions via `channel.send()` throttled at 32ms
- Returns `{ cursors, color, members }` for rendering

## Canvas Components

### Top-Level

- **`canvas-dashboard.tsx`**: Main orchestrator — tool selection, title editing, canvas switching,
  user avatars, text formatting toolbar
- **`canvases-list.tsx`**: Grid of canvas cards with create/delete, context menu for mobile delete

### Viewport and Camera

- **`canvas-viewport.tsx`**: Pan/zoom via mouse, touch, wheel. Persists camera to localStorage.
  Scale range 0.1x–5x.

### Interaction Layer

- **`drawing-layer.tsx`**: Central hub wiring all hooks. Handles pointer events, delegates to
  specialized hooks for pencil/eraser/text/select behavior.

### Rendering

- **`canvas-svg.tsx`**: SVG wrapper with cursor + pointer-events config
- **`path-renderer.tsx`**: Renders paths + current drawing preview
- **`text-renderer.tsx`**: Renders text with formatting, hides editing text
- **`selection-rectangle.tsx`**: Dashed marquee rectangle
- **`text-input-overlay.tsx`**: Positioned input for inline text editing
- **`live-layer.tsx`**: Other users' cursor pointers + initials

### Toolbars

- **`canvas-toolbar.tsx`**: Expandable tool picker (select/hand/pencil/eraser/text)
- **`text-formatting-toolbar.tsx`**: Font size, bold/italic/underline, color picker. Visible only in
  text mode.
- **`canvas-action-toolbar.tsx`**: Undo/redo/delete. Shown when actions available.

## Canvas Hooks

### Data Layer

- **`use-canvas-elements.ts`**: Loads elements via React Query, provides upsert/delete mutations,
  subscribes to Supabase realtime for live sync. Merges loaded data with optimistic updates.
- **`use-realtime-cursors.ts`**: Presence + broadcast for cursor tracking.

### Drawing and Editing

- **`use-drawing.ts`**: Pencil tool — manages current path, generates UUID, persists on finish,
  records undo command
- **`use-text-editing.ts`**: Text create/edit/drag — manages editing state, commits on
  Enter/blur/tool change, deletes empty text, records undo commands. Uses `textFormatting` from
  toolbar for committed text properties.
- **`use-element-selection.ts`**: Marquee selection with `isElementInSelection`
- **`use-element-dragging.ts`**: Multi-element drag with 5px threshold, pending drag pattern,
  records move commands

### User Input

- **`use-canvas-keyboard-shortcuts.ts`**: Delete/Backspace (delete selected), Escape (clear
  selection), Cmd+Z/Cmd+Shift+Z (undo/redo). Skips when focused on input/textarea elements.
- **`use-double-click-detection.ts`**: Manual detection (300ms, 5px threshold)

### History

- **`use-undo-redo.ts`**: Command pattern with undo/redo stacks (max 50). Filters by userId. Clears
  on canvas switch.

## Tool Behaviors

### Pencil Mode

Draw freehand paths. Points captured on pointer move, path persisted on pointer up.

### Eraser Mode

Click to delete paths. Uses `isPointNearPath` hit testing.

### Text Mode

Context-aware click behavior:

1. Click while editing → commits current text, stops editing
2. Click on empty space (not editing) → creates new text
3. Click on existing text → switches to editing that text

Commit always applies current toolbar formatting (fontSize, bold, color, etc.).

### Select Mode

Single-action pattern (like Figma):

1. Click → selects element immediately
2. Click + drag → moves element(s) (5px threshold)
3. Click empty space → starts marquee selection
4. Double-click text → enters text edit mode (switches to text tool)

### Hand Mode

Pan via mouse/touch drag. Handled by `canvas-viewport.tsx`.

## Critical Implementation Details

### Text Editing

- UUID generated in `startTextEditingAtPosition()`, not in `commitText()`
- `onChange` updates both `editingText.value` and `textElements[id].text`
- `TextRenderer` hides text being edited; `TextInputOverlay` shows input instead
- Realtime UPDATE events skip currently editing text (`editingTextId` guard)
- Focus effect runs only when `editingTextId` changes, not on value changes
- Commit uses `textFormatting` from toolbar (not stale `textElements` state)
- Empty text with no `originalTextValue` (never persisted) is cleaned up locally without hitting the
  delete API

### Cookie-Based Auth

The Supabase JS client stores sessions in `localStorage`. An `onAuthStateChange` listener in
`src/lib/auth-client.ts` syncs the token to a cookie so the server-side `getServerSession` can read
it during SSR. After sign-in/sign-out, `router.invalidate()` re-runs root `beforeLoad` which reads
the updated cookie.

## Code Style

- Arrow function expressions (not `function` declarations) — enforced by `func-style` lint rule
- PascalCase for components and types, camelCase for functions and variables
- `useFoo` prefix for custom hooks
- `@/` alias for imports from `src/`
- `const` arrow functions for all components: `export const Component = () => {}`

## Testing Style

- Prefer in-source unit tests for small, self-contained logic when adding test coverage. Follow the
  `if (import.meta.vitest) { ... }` pattern used in `src/lib/server/supabase-auth-cookie.ts`.
- Use separate `*.test.ts` / `*.test.tsx` files for larger integration tests, component tests, or
  when inline tests would make the source harder to read.
- Every new `src/components/ui/` component must have a corresponding `*.stories.tsx` file with
  Storybook stories and `play` function interaction tests using `storybook/test` (`expect`,
  `within`, `userEvent`).

# TypeScript Native Preview (tsgo)

This project uses `@typescript/native-preview` (tsgo) instead of the standard `typescript` compiler.
Run type checking with `vp exec tsgo` instead of `tsc`.

# TanStack Start Routing and SSR

This project uses TanStack Start with file-based routing and SSR with hydration (not React Server
Components). There is no `"use client"` directive — all components are client components by default.
Server logic goes in API route handlers (`src/routes/api/`), `createServerFn()`, or route loaders.

See [docs/ROUTING.md](docs/ROUTING.md) for full details on file conventions, route definitions, SSR
model, and project structure.

# Forms: TanStack Form + Zod

All forms in this project use **TanStack Form** (`@tanstack/react-form`) with **Zod** schemas for
field-level validation. Do not use raw `FormData` extraction or uncontrolled inputs.

## Reference implementations

- `src/features/auth/login.page.tsx` — multi-field sign-in/sign-up forms

## Key rules

- **Controlled state only** — every `<Input>` binds `value` from `field.state.value` and updates via
  `field.handleChange`.
- **No raw FormData** — never use `formData.get()` with type assertions.
- **Zod as the single source of truth** — the same schemas validate on the client (TanStack Form
  validators) and can be reused on the server (API route `parseInput`).
- **Zod over `typeof` guards** — prefer `z.safeParse()` / `z.union()` over manual `typeof` chains.
  The helper `extractFieldError` in `src/lib/form-utils.ts` is the canonical example.
