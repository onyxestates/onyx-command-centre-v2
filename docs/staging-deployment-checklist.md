# Staging Deployment Checklist

## Vercel project setup
- Link the repository to the correct Vercel project
- Confirm `VERCEL_PROJECT_ID` and `VERCEL_ORG_ID` are available locally or in CI
- Configure preview environment variables before first staging deploy
- Confirm `VERCEL_TOKEN` is stored securely in the deployment runner

## Required environment variables
- All `NEXT_PUBLIC_FIREBASE_*` web config variables
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `SESSION_COOKIE_NAME`
- `SESSION_COOKIE_MAX_AGE_DAYS`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT=staging`
- `SENTRY_TRACES_SAMPLE_RATE`
- Optional: `PLAYWRIGHT_BASE_URL`, `E2E_DEMO_EMAIL`, `E2E_DEMO_PASSWORD`

## Preflight flow
1. `corepack pnpm install --frozen-lockfile`
2. `corepack pnpm typecheck`
3. `corepack pnpm lint`
4. `corepack pnpm build`
5. `corepack pnpm test:rules`
6. `RUN_E2E=true corepack pnpm deploy:staging` for a full smoke pass when browsers and staging credentials are available
7. `corepack pnpm deploy:staging`

## Post-deploy checks
- Visit `/api/health`
- Verify login and logout flow
- Verify dashboard, cleanings, maintenance, messaging
- Confirm Sentry events arrive from the staging environment
- Confirm secure session cookie is present and scoped correctly
- Save the preview URL in the pilot release notes
