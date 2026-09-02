import ejs from 'ejs';
import path from 'path';

import { envs } from '@/config/env/env';

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
  });
};

export default renderTemplate;
