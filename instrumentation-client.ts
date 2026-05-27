import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const tracesSampleRate = Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0);
const replaysSessionSampleRate = Number(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE ?? 0);
const replaysOnErrorSampleRate = Number(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE ?? 0);

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0,
  replaysSessionSampleRate: Number.isFinite(replaysSessionSampleRate) ? replaysSessionSampleRate : 0,
  replaysOnErrorSampleRate: Number.isFinite(replaysOnErrorSampleRate) ? replaysOnErrorSampleRate : 0,
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
