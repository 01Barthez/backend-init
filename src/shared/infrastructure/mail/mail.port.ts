/**
 * Mailer port — outbound email contract for application services.
 * Adapters (SMTP + queue) live alongside this interface.
 */
export interface MailPayload {
  to: string;
  subject: string;
  template: string;
  data?: Record<string, unknown>;
}

export interface MailerPort {
  send(payload: MailPayload): Promise<void>;
  verify(): Promise<void>;
}
