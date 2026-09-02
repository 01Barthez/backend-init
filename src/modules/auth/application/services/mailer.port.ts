/**
 * Thin mailer port so use cases do not import Bull/Nodemailer directly.
 * Default adapter wraps `@/shared/infrastructure/mail/mail.service`.
 */
export type MailTemplateName =
  | 'otp'
  | 'welcome'
  | 'reset-password'
  | 'alert-login'
  | 'password-changed'
  | string;

export type QueueMailInput = {
  to: string;
  subject: string;
  template: MailTemplateName;
  data: Record<string, unknown>;
};

export interface MailerPort {
  queue(input: QueueMailInput): Promise<void>;
}
