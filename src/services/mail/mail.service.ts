import nodemailer from 'nodemailer';

import { envs } from '@/config/env/env';
import log from '@/services/logging/logger';
import { renderTemplate, getMailFromAddress } from '@/services/mail/template.service';
import { mailQueue } from '@/services/queue/queue.service';

import type { MailJobPayload, SendMailOptions } from './mail.types';

const transporter = nodemailer.createTransport({
  host: envs.SMTP_HOST,
  port: envs.SMTP_PORT,
  secure: envs.SMTP_PORT === 465,
  auth: { user: envs.SMTP_USER, pass: envs.SMTP_PASS },
  pool: true,
  maxConnections: 5,
});

export const verifyMailTransport = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    log.info('SMTP transport verified');
    return true;
  } catch (error) {
    log.error('SMTP transport verification failed', { error });
    return false;
  }
};

export const sendMailDirect = async (payload: MailJobPayload): Promise<void> => {
  const html = await renderTemplate(payload.template, payload.data);

  await transporter.sendMail({
    from: getMailFromAddress(),
    to: payload.to,
    subject: payload.subject,
    html,
  });
};

export const queueMail = async (options: SendMailOptions): Promise<void> => {
  await mailQueue.add('send-mail', options, {
    priority: options.priority ?? 5,
  });
};

export default queueMail;
