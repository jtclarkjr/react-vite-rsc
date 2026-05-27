# Graphify

This boilerplate does not commit generated Graphify state. Each clone creates its own
`graphify-out/` folder from the local project root.

## Requirements

- Python with `pip`
- Graphify installed with `pip install graphifyy`
- Node.js, provided by the Vite+ environment

## Setup

```sh
pip install graphifyy
vp run graphify:setup
```

The `graphifyy` package provides the `graphify` command. The setup script writes
`graphify-out/.graphify_root` from the current working directory.

The root script is guarded: it refuses to write through symlinks, refuses path collisions, and will
not replace an existing `.graphify_root` that points to a different directory unless you run:

```sh
node scripts/graphify-root.mjs --force
```

## Build or Refresh the Graph

```sh
vp run graphify:update
```

This refreshes the AST-only graph and exports the call-flow HTML. Run it after code changes when you
want the local graph to stay current.

## Troubleshooting

If Graphify fails with a cache initialization error such as:

```text
Failed to initialize cache: Unrecognized database version: 12
```

or:

```text
Failed to initialize cache at `/Users/<user>/.cache/uv`
```

the problem is usually uv's package cache, not this repo's `graphify-out/` cache. Clear uv's cache
and rerun Graphify:

```sh
uv cache clean
graphify update .
```

If running Graphify through `uvx`, use the package's provided executable name:

```sh
uvx --from graphifyy graphify update .
```

## Optional Agent Integration

Install the Graphify integration for the coding agent you use:

```sh
graphify install --platform codex
graphify install --platform claude
graphify install --platform cursor
graphify install --platform opencode
```

You can also run agent-specific commands such as `graphify codex install` or
`graphify claude install` if your agent supports them.
