# Pilot UAT Checklist

## Sign-off metadata
- Pilot environment URL:
- Test date:
- Tester names:
- Workspace used:
- Build / commit reference:
- Go / no-go decision:

## Authentication and access
- Verify unauthenticated access to `/dashboard` redirects to `/login`
- Verify authenticated users are redirected away from `/login`
- Verify secure session cookie is issued after login
- Verify secure session cookie clears after logout
- Verify admin can access all modules
- Verify cleaner cannot access settings, reports, guest inbox admin actions, or unrelated maintenance issues
- Verify contractor only sees assigned or vendor-linked maintenance work
- Verify session remains valid after browser refresh and 30+ minutes idle time

## Operational workflows
- Cleaner can move an assigned cleaning job from `assigned` to `in_progress`
- Cleaner can complete required checklist items
- Cleaner cannot submit for review without required evidence when cleaning photos are enabled
- Staff can approve a reviewed cleaning job and mark it ready for arrival
- Contractor can upload maintenance evidence
- Staff can move maintenance issues across triage states
- Guest thread can be marked `open`, `pending`, and `resolved`
- Internal note does not expose guest-visible content
- Reservation lifecycle sync updates check-in readiness when cleaning completes

## Dashboard and responsiveness
- Dashboard loads on desktop, tablet, and mobile without layout overlap
- Data tables collapse into card layout on mobile
- Topbar remains usable on small screens
- Command feed and urgent focus panels remain readable on 390px width
- Auth screens remain usable at 390px width

## Error handling and monitoring
- Triggered runtime errors are shown with retry UI
- App route errors capture a digest when available
- Sentry DSN is configured in staging and receives a test event
- Health endpoint `/api/health` returns `{ ok: true }`
- Console output is structured and includes timestamp / environment metadata

## Deployment validation
- Staging deploy completes successfully on Vercel
- Environment variables are present in preview and production
- Session cookie is issued in staging after successful login
- Firestore and Storage permissions work as expected against staging Firebase
- Rollback path is documented and last known good deployment URL is saved

## Exit criteria
- No Sev-1 or Sev-2 defects open
- All access-control, workflow, and deployment checks pass
- Monitoring receives errors and breadcrumbs from staging
- Pilot workspace owners sign off
