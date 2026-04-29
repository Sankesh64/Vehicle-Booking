// ============================================================
// Sentry Error Monitoring Configuration
// Scrubs sensitive data before sending to Sentry
// ============================================================
import * as Sentry from '@sentry/node';
import { env } from './env';
import { logger } from './logger';

export function initSentry(): void {
  if (!env.SENTRY_DSN) {
    logger.warn('Sentry DSN not provided — error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.2 : 1.0,
    beforeSend(event) {
      // Scrub sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      // Scrub sensitive body fields
      if (event.request?.data && typeof event.request.data === 'object') {
        const data = event.request.data as Record<string, unknown>;
        const sensitiveFields = ['password', 'token', 'refreshToken', 'cardNumber', 'cvv'];
        for (const field of sensitiveFields) {
          if (field in data) {
            data[field] = '[REDACTED]';
          }
        }
      }
      return event;
    },
    integrations: [
      Sentry.httpIntegration(),
    ],
  });

  logger.info('✅ Sentry initialized');
}

export { Sentry };
