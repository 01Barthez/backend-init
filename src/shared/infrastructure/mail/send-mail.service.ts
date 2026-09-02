import { envs } from '@/app/config';
import log from '@/shared/infrastructure/logging/logger';
import { getMailFromAddress } from '@/shared/infrastructure/mail/template.service';

import transporter from './config/transporter';
import templateManager from './templates/template-manager';

/**
 * Legacy direct-send helper (template manager + transporter).
 * New code should prefer queueMail / sendMailDirect.
 */
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

    log.debug('Rendering email template', { templateName });
    const content = await renderTemplate({
      ...templateData,
      appName: envs.APP_NAME,
      year: new Date().getFullYear(),
    });

    const mailOptions = {
      from: getMailFromAddress(),
      to: receiver,
      subject: subjet,
      html: content,
    };

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
