import type { ITemplateOTP, ITemplateResetPassword } from '../interface/types';
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

  // Others tmplates can be added here as needed
  // someOtherTemplate: (data: SomeTemplateType) =>
  //   renderTemplate('some-other.ejs', data, 'Some Other'),
};

export default templateManager;
