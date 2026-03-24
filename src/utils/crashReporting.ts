/**
 * Crash Reporting — Sentry wrapper
 *
 * Setup:
 *   1. npm install @sentry/react-native
 *   2. npx @sentry/wizard@latest -i reactNative
 *   3. Set SENTRY_DSN in .env (or EAS Secrets for production)
 *   4. Uncomment the Sentry imports below and remove the stub implementations
 */

// ── Uncomment when @sentry/react-native is installed ──────────────────────────
// import * as Sentry from '@sentry/react-native'
//
// export function initCrashReporting(): void {
//   Sentry.init({
//     dsn: process.env.SENTRY_DSN ?? '',
//     tracesSampleRate: 0.2,
//     debug: __DEV__,
//   })
// }
//
// export function captureException(error: unknown, context?: Record<string, unknown>): void {
//   Sentry.captureException(error, context ? { extra: context } : undefined)
// }
//
// export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
//   Sentry.captureMessage(message, level)
// }
// ──────────────────────────────────────────────────────────────────────────────

// Stub implementations (active until Sentry is installed)
export function initCrashReporting(): void {
  if (__DEV__) console.log('[CrashReporting] Sentry not configured — install @sentry/react-native')
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  console.error('[CrashReporting] captureException:', error, context)
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  console.log(`[CrashReporting] captureMessage [${level}]:`, message)
}
