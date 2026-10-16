#!/usr/bin/env bash
set -euo pipefail

# Void writes generated config at the project root; keep that off the host checkout.
tar -C /source \
  --exclude='./.git' \
  --exclude='./.agents' \
  --exclude='./.claude' \
  --exclude='./.codex' \
  --exclude='./.aws' \
  --exclude='./node_modules' \
  --exclude='./.void' \
  --exclude='./.wrangler' \
  --exclude='./.void-wrangler.jsonc' \
  --exclude='./dist' \
  --exclude='./storybook-static' \
  --exclude='./test-results' \
  --exclude='./playwright-report' \
  --exclude='./src' \
  --exclude='./routes' \
  --exclude='./middleware' \
  --exclude='./server' \
  --exclude='./db' \
  --exclude='./public' \
  --exclude='./.storybook' \
  -cf - . | tar -C /app -xf -

exec "$@"
