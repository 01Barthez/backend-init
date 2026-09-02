/**
 * Thin mailer port so user use cases do not import Bull/Nodemailer directly.
 */
export type MailTemplateName = 'account-deleted' | 'account-restored' | 'role-changed' | string;

export type QueueMailInput = {
  to: string;
  subject: string;
  template: MailTemplateName;
  data: Record<string, unknown>;
};

export interface MailerPort {
  queue(input: QueueMailInput): Promise<void>;
}
