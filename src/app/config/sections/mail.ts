/**
 * Outbound email (SMTP) configuration.
 * Transport details stay here; templates and queuing live under shared/modules.
 */
import { fromEnv } from '../env';

export const mailConfig = {
  host: fromEnv.get('SMTP_HOST').required().asString(),
  port: fromEnv.get('SMTP_PORT').required().asPortNumber(),
  user: fromEnv.get('SMTP_USER').required().asString(),
  pass: fromEnv.get('SMTP_PASS').required().asString(),

  /** Envelope "from" address. */
  fromAddress: fromEnv.get('USER_EMAIL').required().asEmailString(),

  /**
   * Display name shown in email clients.
   * Falls back to APP_NAME when empty.
   */
  fromName: fromEnv.get('MAIL_FROM_NAME').default('').asString(),
} as const;

export type MailConfig = typeof mailConfig;
