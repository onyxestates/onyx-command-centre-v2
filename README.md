# Onyx Command Centre

Premium operational SaaS MVP for short-term rental teams, built with Next.js App Router, TypeScript, Tailwind CSS, Firebase Auth, Firestore, and Firebase Storage.

## Included
- App Router layouts for auth and protected app modules
- Responsive desktop, tablet, and mobile shell with sidebar and mobile nav
- Functional screens for dashboard, properties, reservations, guests, messaging, cleanings, maintenance, calendar, reports, inventory, and settings
- Firebase Auth provider, server-side session cookie auth, and Firestore query hooks
- Sentry-ready monitoring, global error boundaries, and structured logging helpers
- Firestore security rules, Storage upload rules, and composite indexes
- Emulator-ready Firebase config
- Playwright smoke tests and Firebase Security Rules emulator tests
- Demo seed script for workspace, users, listings, reservations, threads, messages, tasks, vendors, inventory, notifications, and activity logs

## Local development
1. Copy `.env.example` to `.env.local` and fill Firebase web credentials.
2. Add Firebase Admin credentials by either:
   - placing a service account at `scripts/serviceAccountKey.json` and setting `GOOGLE_APPLICATION_CREDENTIALS`, or
   - setting `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, and `FIREBASE_ADMIN_PRIVATE_KEY`.
3. Install dependencies:
   ```bash
   corepack pnpm install
   ```
4. Seed demo data:
   ```bash
   corepack pnpm exec tsx scripts/seed-demo-data.ts
   ```
5. Start the app:
   ```bash
   corepack pnpm dev
   ```

## Verification and smoke tests
```bash
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
corepack pnpm test:rules
corepack pnpm playwright:install
corepack pnpm test:e2e
```

## Firebase emulators
```bash
corepack pnpm emulators
```

Set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` in `.env.local` to target the emulator suite.

## Vercel deployment
1. Import the repository into Vercel.
2. Set all public Firebase web variables from `.env.example`.
3. Set the Firebase Admin variables for server-side session auth:
   - `FIREBASE_ADMIN_PROJECT_ID`
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY`
4. Set monitoring and deploy variables as needed:
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_DSN`
   - `SENTRY_ENVIRONMENT`
   - `SENTRY_TRACES_SAMPLE_RATE`
   - `SESSION_COOKIE_NAME`
   - `SESSION_COOKIE_MAX_AGE_DAYS`
5. Use the included scripts:
   ```bash
   corepack pnpm vercel:pull:staging
   corepack pnpm deploy:staging
   corepack pnpm deploy:production
   ```
6. After deploy, verify:
   - login creates a secure session cookie
   - protected routes redirect correctly
   - dashboard, cleanings, maintenance, and messaging load against production Firebase
   - `/api/health` returns a healthy response
   - Sentry receives a staging test event

## Pilot launch docs
- `docs/pilot-uat-checklist.md`
- `docs/staging-deployment-checklist.md`
- `docs/vercel-firebase-sentry-deployment-playbook.md`
- `.env.staging.example`
- `.env.production.example`

## Demo credentials
- Admin: `daniel@northbridgestays.com`
- Manager: `sophie@northbridgestays.com`
- Cleaner: `elena.reyes@northbridgestays.com`
- Password: `OnyxDemo!2026` unless overridden by `ONYX_DEMO_PASSWORD`

## Architecture
- `src/app`: route groups, API routes, loading/error boundaries, and pages
- `src/components`: reusable UI, layout, data, and feedback components
- `src/features`: page-level screens and auth forms
- `src/hooks`: auth and Firestore query hooks
- `src/lib`: Firebase client/admin utilities, monitoring, and shared helpers
- `src/providers`: auth context provider
- `tests`: Playwright smoke tests and Firebase Emulator rules tests
- `scripts`: Firebase Admin demo seeding and Vercel deployment helpers
