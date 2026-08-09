import { task } from '@trigger.dev/sdk'

// Deliberately throws so we can confirm the global onFailure hook in
// features/init.ts is forwarding task errors to Sentry. Run this from the
// Trigger.dev dashboard's "Test" page with an empty payload.
export const sentryErrorTest = task({
  id: 'sentry-error-test',
  retry: {
    // Only retry once
    maxAttempts: 1,
  },
  run: async () => {
    const error = new Error('This is a custom error that Sentry will capture')
    error.cause = { additionalContext: 'This is additional context' }
    throw error
  },
})
