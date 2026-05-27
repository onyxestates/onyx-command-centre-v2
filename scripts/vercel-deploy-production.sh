#!/usr/bin/env bash
set -euo pipefail

bash scripts/vercel-preflight.sh production
corepack pnpm exec vercel build --prod --token="$VERCEL_TOKEN"
corepack pnpm exec vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN" --yes
