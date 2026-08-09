import { tasks } from '@trigger.dev/sdk'
import * as Sentry from '@sentry/node'

// Initialize Sentry for Trigger.dev tasks
Sentry.init({
  defaultIntegrations: false,
  dsn: process.env.SENTRY_DSN,
  environment:
    process.env.NODE_ENV === 'production' ? 'production' : 'development',
})

// Global lifecycle hook: capture every task failure in Sentry
tasks.onFailure(({ payload, error, ctx }) => {
  Sentry.captureException(error, {
    extra: {
      payload,
      ctx,
    },
  })
})
