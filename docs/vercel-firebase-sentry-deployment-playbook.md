# Vercel + Firebase + Sentry Deployment Playbook

This playbook is the canonical release guide for Onyx Command Centre across staging and production. Use it together with:
- `docs/staging-deployment-checklist.md`
- `docs/pilot-uat-checklist.md`
- `.env.staging.example`
- `.env.production.example`
- `scripts/vercel-preflight.sh`

---

## 1. Exact deployment order

### Staging first, always
1. Finalise code on the release branch
2. Populate staging environment variables in Vercel
3. Configure Firebase staging Auth domains
4. Deploy Firestore rules and indexes to staging Firebase
5. Deploy Storage rules to staging Firebase
6. Run `corepack pnpm env:check:staging`
7. Run `corepack pnpm deploy:staging`
8. Run staging post-deployment verification
9. Run pilot UAT against staging
10. Fix any blocker before touching production

### Production only after staging sign-off
1. Confirm staging passed with no Sev-1 / Sev-2 issues
2. Populate production environment variables in Vercel
3. Configure Firebase production Auth domains
4. Deploy Firestore rules and indexes to production Firebase
5. Deploy Storage rules to production Firebase
6. Run `corepack pnpm env:check:production`
7. Run `corepack pnpm deploy:production`
8. Run production smoke tests
9. Monitor Sentry and logs closely for the first 24 hours

---

## 2. Required environment variables

### Shared application variables
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_DEFAULT_WORKSPACE_ID`
- `SESSION_COOKIE_NAME`
- `SESSION_COOKIE_MAX_AGE_DAYS`

### Firebase Admin variables
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

### Sentry variables
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_ENVIRONMENT`
- `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`
- `NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE`
- `NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE`
- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`
- `SENTRY_TRACES_SAMPLE_RATE`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

### Vercel / deployment variables
- `VERCEL_PROJECT_ID`
- `VERCEL_ORG_ID`
- `VERCEL_TOKEN`

### Optional release validation variables
- `PLAYWRIGHT_BASE_URL`
- `E2E_DEMO_EMAIL`
- `E2E_DEMO_PASSWORD`

---

## 3. Firebase Auth setup

### Staging Auth setup
1. Open Firebase Console → Authentication → Settings → Authorized domains
2. Add the staging / preview Vercel domain
3. Add the custom staging domain if used
4. Confirm email/password auth is enabled
5. Verify test users can sign in from the staging URL

### Production Auth setup
1. Add the production Vercel domain
2. Add the final custom domain
3. Remove stale preview domains that should not be used for real-customer login
4. Verify login creates a secure server session cookie
5. Verify logout clears the session cookie

### Session behaviour to confirm
- Protected routes redirect unauthenticated users to `/login`
- Logged-in users are redirected away from `/login`
- Session survives refresh
- Session re-sync works after idle time and browser focus return

---

## 4. Firestore production rules deployment

### Files used
- `firestore.rules`
- `firestore.indexes.json`

### Staging deployment
```bash
firebase use <staging-project-id>
firebase deploy --only firestore:rules,firestore:indexes
```

### Production deployment
```bash
firebase use <production-project-id>
firebase deploy --only firestore:rules,firestore:indexes
```

### Required verification
- Staff can read operational data
- Cleaner can only update assigned cleaning jobs
- Contractor can only update assigned or vendor-linked maintenance issues
- Internal notes are not guest-visible
- Unauthorized read/write attempts fail

---

## 5. Storage rules deployment

### File used
- `storage.rules`

### Staging deployment
```bash
firebase use <staging-project-id>
firebase deploy --only storage
```

### Production deployment
```bash
firebase use <production-project-id>
firebase deploy --only storage
```

### Required verification
- Cleaner can upload evidence to assigned cleaning path only
- Contractor can upload maintenance evidence to assigned issue only
- Unsupported file types are blocked
- Unauthenticated uploads fail

---

## 6. Sentry setup steps

### Create environments
- Create `staging` environment
- Create `production` environment

### Create projects / DSNs
- Frontend DSN for browser events
- Backend DSN for server and edge events

### Configure variables in Vercel
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_ENVIRONMENT`
- `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`
- `NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE`
- `NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE`
- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`
- `SENTRY_TRACES_SAMPLE_RATE`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

### Verification steps
1. Deploy staging
2. Trigger a client-side handled error
3. Trigger a route / server error in staging
4. Confirm breadcrumbs and environment tags are correct
5. Confirm no secrets or sensitive PII are being captured
6. Create alert rules for error spikes and new issues

---

## 7. Vercel project configuration

### Project basics
- Framework preset: Next.js
- Install command: `corepack pnpm install --frozen-lockfile`
- Build command: `corepack pnpm exec next build`
- Output handled by Vercel for Next.js App Router

### Environment separation in Vercel
- Preview / staging environment vars point to staging Firebase + staging Sentry
- Production environment vars point to production Firebase + production Sentry
- Never reuse the same Firebase project for preview and production
- Never reuse the same Sentry environment label for both stages

### Included repo scripts
- `corepack pnpm vercel:pull:staging`
- `corepack pnpm deploy:staging`
- `corepack pnpm deploy:production`
- `corepack pnpm env:check:staging`
- `corepack pnpm env:check:production`

---

## 8. Custom domain setup

### Staging domain
- Recommended format: `staging.<yourdomain>` or `pilot.<yourdomain>`
- Add domain in Vercel project settings
- Verify DNS resolution
- Add that domain to Firebase Auth authorized domains

### Production domain
- Add final customer-facing domain in Vercel
- Verify SSL is issued and active
- Add that domain to Firebase Auth authorized domains
- Re-test login and logout on the final domain

### Cookie / security checks
- Verify `Secure` cookies in production HTTPS
- Verify no mixed-content issues
- Verify `/api/health` works on the custom domain

---

## 9. Staging vs production environment separation

### Must be separate
- Firebase project
- Firestore data
- Storage bucket
- Auth domains
- Sentry environment
- Default workspace IDs
- Demo users / pilot test users

### Never share between staging and production
- Real customer data
- Upload evidence files
- Production Admin credentials
- Production DSNs in preview deployments

---

## 10. Rollback procedures

### Application rollback
1. Identify the last known good Vercel deployment
2. Promote or restore that deployment
3. Re-run production smoke tests
4. Keep the broken deployment for diagnosis, but do not route traffic to it

### Config rollback
1. Revert recent Vercel env var changes if the issue is config-related
2. Re-deploy after env fix
3. Re-test Auth, Firestore access, uploads, and Sentry

### Firebase rollback
- Firestore rules: redeploy the last known good `firestore.rules`
- Firestore indexes: redeploy the last known good `firestore.indexes.json`
- Storage rules: redeploy the last known good `storage.rules`

### Data rollback
- Use Firestore export / restore procedures
- Restore Storage objects from backup if needed
- Record the incident and corrective action

---

## 11. Post-deployment verification checklist

### Core release checks
- `/api/health` returns healthy JSON
- Login succeeds
- Logout succeeds
- Protected routes enforce redirects
- Dashboard loads
- Cleanings loads
- Maintenance loads
- Messaging loads
- Sentry receives at least one validation event
- No critical console or network errors during first smoke pass

### Role checks
- Admin can access all modules
- Staff can access operations modules
- Cleaner sees only assigned work
- Contractor sees only assigned or vendor-linked maintenance

### Upload checks
- Cleaner evidence upload succeeds on valid job
- Cleaner unrelated upload fails
- Contractor maintenance upload succeeds on valid issue
- Unsupported upload type fails

---

## 12. Mobile testing checklist

Test on at least:
- iPhone width ~390px
- Tablet width ~768px
- Laptop width ~1280px

### Mobile-specific checks
- Login page fully usable
- Forgot-password page fully usable
- Signup page fully usable
- Topbar does not overlap content
- Mobile nav is tappable
- Dashboard cards remain readable
- Command feed remains readable
- Cleanings actions remain tappable
- Maintenance upload input remains usable
- Messaging thread list and composer remain usable

---

## 13. Production smoke test checklist

### Anonymous checks
- Visit home page
- Verify redirect flow is correct
- Verify `/api/health`

### Auth checks
- Login as admin
- Refresh dashboard
- Verify session persists
- Logout and verify redirect

### Role checks
- Login as cleaner and verify restrictions
- Login as contractor and verify restrictions

### Workflow checks
- Move a cleaner task to `in_progress`
- Upload a cleaning evidence image
- Upload a maintenance evidence file
- Update a guest thread status
- Confirm dashboard still loads after live data changes

### Monitoring checks
- Confirm Sentry receives browser event
- Confirm Sentry receives server event
- Confirm no new Sev-1 errors appear in first 30 minutes

---

## 14. Repo staging-preparation commands

### Validate staging configuration
```bash
corepack pnpm env:check:staging
```

### Full staging preflight
```bash
bash scripts/vercel-preflight.sh preview
```

### Deploy staging
```bash
corepack pnpm deploy:staging
```

### Optional full smoke deploy
```bash
RUN_E2E=true corepack pnpm deploy:staging
```
