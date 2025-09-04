import ejs from 'ejs';
import fs from 'fs';
import path from 'path';

import type { ITemplateOTP, ITemplateResetPassword } from './interface/types';

const templateManager = {
  otp: async (templateData: ITemplateOTP): Promise<string> => {
    const templatePath = path.join(__dirname, '../templates/otp.ejs');
    const template = fs.readFileSync(templatePath, 'utf8');
    return ejs.render(template, templateData);
  },

  resetPassword: async (templateData: ITemplateResetPassword): Promise<string> => {
    const templatePath = path.join(__dirname, '../templates/reset-password.ejs');
    const template = fs.readFileSync(templatePath, 'utf8');
    return ejs.render(template, templateData);
  },

  // Other templates here ......
};

export default templateManager;
