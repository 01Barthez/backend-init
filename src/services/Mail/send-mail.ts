import { envs } from '@/config/env/env';

import templateManager from './template-manager';
import transporter from './transporter-config';

async function send_mail<K extends keyof typeof templateManager>(
  receiver: string,
  subjet: string,
  templateName: K,
  templateData: any,
) {
  try {
    const renderTemplate = templateManager[templateName];
    if (!renderTemplate) {
      throw new Error(`Failed to render template ${templateName}`);
    }

    const content = await renderTemplate(templateData);

    //&options du message a envoyer
    const mailOptions = {
      from: `GTA : <${envs.USER_EMAIL}>`,
      to: receiver,
      subject: subjet,
      html: content,
    };

    // Envoi du message
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error(`Failed to send mail to user ${receiver}: ${error}`);
  }
}

export default send_mail;
