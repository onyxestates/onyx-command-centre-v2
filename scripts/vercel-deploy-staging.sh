#!/usr/bin/env bash
set -euo pipefail

bash scripts/vercel-preflight.sh preview
corepack pnpm exec vercel build --token="$VERCEL_TOKEN"
corepack pnpm exec vercel deploy --prebuilt --token="$VERCEL_TOKEN" --yes
