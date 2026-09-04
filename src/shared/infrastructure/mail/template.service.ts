/**
 * EJS template rendering for transactional mail.
 * Template files live next to this module under ./templates.
 */
import ejs from 'ejs';
import path from 'path';

import { envs } from '@/app/config';

import type { MailTemplateName } from './mail.types';

const templatesDir = path.join(__dirname, 'templates');

const templateFiles: Record<MailTemplateName, string> = {
  otp: 'otp.ejs',
  welcome: 'welcome.ejs',
  'reset-password': 'reset-password.ejs',
  'alert-login': 'alert-login.ejs',
  'account-deleted': 'account-deleted.ejs',
  'account-restored': 'account-restored.ejs',
  'password-changed': 'password-changed.ejs',
  'role-changed': 'role-changed.ejs',
  'user-invited': 'user-invited.ejs',
  'db-notification-success': 'db-notification-success.ejs',
  'db-notification-error': 'db-notification-error.ejs',
};

export const getMailFromAddress = (): string => {
  const fromName = envs.MAIL_FROM_NAME || envs.APP_NAME;
  return `${fromName} <${envs.USER_EMAIL}>`;
};

export const renderTemplate = async (
  template: MailTemplateName,
  data: Record<string, unknown>,
): Promise<string> => {
  const file = templateFiles[template];
  if (!file) throw new Error(`Unknown mail template: ${template}`);

  return ejs.renderFile(path.join(templatesDir, file), {
    ...data,
    appName: envs.APP_NAME,
    year: new Date().getFullYear(),
    // Always present so templates can reference them safely (even in docs comments).
    clientUrl: (data.clientUrl as string | undefined) ?? envs.CLIENT_URL ?? '',
    supportEmail: (data.supportEmail as string | undefined) ?? envs.USER_EMAIL ?? '',
  });
};

export default renderTemplate;
