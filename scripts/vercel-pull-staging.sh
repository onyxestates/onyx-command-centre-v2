#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "VERCEL_TOKEN is required"
  exit 1
fi

if [[ -z "${VERCEL_PROJECT_ID:-}" || -z "${VERCEL_ORG_ID:-}" ]]; then
  echo "VERCEL_PROJECT_ID and VERCEL_ORG_ID are required"
  exit 1
fi

corepack pnpm exec vercel pull --yes --environment=preview --token="$VERCEL_TOKEN"
