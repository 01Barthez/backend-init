export type MailTemplateName =
  | 'otp'
  | 'welcome'
  | 'reset-password'
  | 'alert-login'
  | 'account-deleted'
  | 'account-restored'
  | 'password-changed'
  | 'role-changed'
  | 'db-notification-success'
  | 'db-notification-error';

export interface MailJobPayload {
  to: string;
  subject: string;
  template: MailTemplateName;
  data: Record<string, unknown>;
}

export interface SendMailOptions extends MailJobPayload {
  priority?: number;
}
