import type {
  ITemplateNotificationError,
  ITemplateNotificationSuccess,
  ITemplateOTP,
  ITemplateResetPassword,
} from '../interface/types';
import { renderTemplate } from '../utils/utils';

/**
 * Export des fonctions spécifiques, en utilisant la fonction générique
 */
const templateManager = {
  otp: (data: ITemplateOTP) => renderTemplate('otp.ejs', data, 'OTP'),

  resetPassword: (data: ITemplateResetPassword) =>
    renderTemplate('reset-password.ejs', data, 'Reset Password'),

  welcome: (data: ITemplateResetPassword) => renderTemplate('welcome.ejs', data, 'Welcome'),

  alert_login: (data: ITemplateResetPassword) =>
    renderTemplate('alert-login.ejs', data, 'Alert Login'),

  backup_success_notification: (data: ITemplateNotificationSuccess) =>
    renderTemplate('db-notification-success.ejs', data, 'DB Notification Success'),

  backup_error_notification: (data: ITemplateNotificationError) =>
    renderTemplate('db-notification-error.ejs', data, 'DB Notification Error'),
};

export default templateManager;
