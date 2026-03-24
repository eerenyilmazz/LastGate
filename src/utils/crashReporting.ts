import * as Sentry from '@sentry/react-native'

export function initCrashReporting(): void {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) {
    if (__DEV__) console.warn('[Sentry] SENTRY_DSN not set — crash reporting disabled')
    return
  }
  Sentry.init({
    dsn,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    debug: __DEV__,
    environment: __DEV__ ? 'development' : 'production',
  })
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  Sentry.captureException(error, context ? { extra: context } : undefined)
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level)
}
