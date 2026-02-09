import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only send 20% of transactions in production (saves quota)
  tracesSampleRate: 0.2,

  // Capture 100% of errors
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,

  // Don't send in development
  enabled: process.env.NODE_ENV === "production",
});
