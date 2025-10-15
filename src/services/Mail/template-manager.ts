import ejs from 'ejs';
import fs from 'fs';
import path from 'path';

import log from '@/services/logging/logger';

import type { ITemplateOTP, ITemplateResetPassword } from './interface/types';

const templateManager = {
  otp: async (templateData: ITemplateOTP): Promise<string> => {
    try {
      const templatePath = path.join(__dirname, '../templates/otp.ejs');
      log.debug('Loading OTP template', { templatePath, exists: fs.existsSync(templatePath) });

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file not found: ${templatePath}`);
      }

      const template = fs.readFileSync(templatePath, 'utf8');
      return ejs.render(template, templateData);
    } catch (error: any) {
      log.error('Failed to render OTP template', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  resetPassword: async (templateData: ITemplateResetPassword): Promise<string> => {
    try {
      const templatePath = path.join(__dirname, '../templates/reset-password.ejs');
      log.debug('Loading reset password template', {
        templatePath,
        exists: fs.existsSync(templatePath),
      });

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file not found: ${templatePath}`);
      }

      const template = fs.readFileSync(templatePath, 'utf8');
      return ejs.render(template, templateData);
    } catch (error: any) {
      log.error('Failed to render reset password template', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },

  // Other templates here ......
};

export default templateManager;
