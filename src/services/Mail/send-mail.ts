import { envs } from '@/config/env/env';
import log from '@/services/logging/logger';

import transporter from './_config/transporter';
import templateManager from './templates/template-manager';

async function send_mail<K extends keyof typeof templateManager>(
  receiver: string,
  subjet: string,
  templateName: K,
  templateData: any,
) {
  try {
    log.info('Attempting to send email', {
      receiver,
      subject: subjet,
      template: templateName,
    });

    const renderTemplate = templateManager[templateName];
    if (!renderTemplate) {
      const error = `Template '${templateName}' not found in templateManager`;
      log.error('Template not found', {
        templateName,
        availableTemplates: Object.keys(templateManager),
      });
      throw new Error(error);
    }

    // Render template
    log.debug('Rendering email template', { templateName });
    const content = await renderTemplate(templateData);

    // Mail options
    const mailOptions = {
      from: `GTA:<${envs.USER_EMAIL}>`,
      to: receiver,
      subject: subjet,
      html: content,
    };

    // Send email
    log.debug('Sending email via SMTP', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      smtpHost: envs.SMTP_HOST,
      smtpPort: envs.SMTP_PORT,
    });

    const info = await transporter.sendMail(mailOptions);

    log.info('Email sent successfully', {
      receiver,
      subject: subjet,
      messageId: info.messageId,
      response: info.response,
    });

    return info;
  } catch (error: any) {
    log.error('Failed to send email', {
      receiver,
      subject: subjet,
      template: templateName,
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Failed to send mail to user ${receiver}: ${error.message || error}`);
  }
}

export default send_mail;
