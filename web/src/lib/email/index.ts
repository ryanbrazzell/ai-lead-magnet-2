/**
 * Email Service Barrel Export
 *
 * Provides centralized exports for all email-related functionality
 * including template generation, Mailgun client operations, and
 * async notification handling.
 */

// Template generation functions
export { generateEmailHtml, generateEmailText } from './template';

// Mailgun client functions
export {
  validateMailgunConfig,
  createMailgunClient,
  validateEmailAddress,
  sendEmailWithMailgun,
} from './mailgun';

// Mailgun config type
export type { MailgunConfigResult } from './mailgun';

// Async notification functions (fire-and-forget pattern)
export {
  sendAsyncNotifications,
  sendEmailAsync,
  getBaseUrl,
  log,
} from './asyncNotifications';
