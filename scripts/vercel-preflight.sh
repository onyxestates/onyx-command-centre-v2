#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-preview}"
RUN_E2E="${RUN_E2E:-false}"

require_env() {
  local key="$1"
  if [[ -z "${!key:-}" ]]; then
    echo "$key is required"
    exit 1
  fi
}

require_env VERCEL_TOKEN
require_env VERCEL_PROJECT_ID
require_env VERCEL_ORG_ID

corepack pnpm install --frozen-lockfile
corepack pnpm env:check:${ENVIRONMENT/preview/staging}
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
corepack pnpm test:rules

if [[ "$RUN_E2E" == "true" ]]; then
  corepack pnpm playwright:install
  corepack pnpm test:e2e
fi

corepack pnpm exec vercel pull --yes --environment="$ENVIRONMENT" --token="$VERCEL_TOKEN"
