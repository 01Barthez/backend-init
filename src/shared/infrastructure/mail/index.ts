/** Mail infrastructure — ports, SMTP/queue adapters, templates. */
export type { MailerPort, MailPayload } from './mail.port';
export {
  default,
  mailerAdapter,
  queueMail,
  sendMailDirect,
  verifyMailTransport,
} from './mail.service';
export type { MailJobPayload, MailTemplateName, SendMailOptions } from './mail.types';
export { buildMailBrandLocals } from './mail-brand';
export { default as send_mail } from './send-mail.service';
export { getMailFromAddress, renderTemplate } from './template.service';
