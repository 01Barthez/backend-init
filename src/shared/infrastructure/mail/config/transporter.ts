import nodemailer from 'nodemailer';

import { envs } from '@/app/config';

/** Nodemailer transport used by the legacy send_mail path. */
const transporter = nodemailer.createTransport({
  host: envs.SMTP_HOST,
  port: envs.SMTP_PORT,
  secure: false,
  ignoreTLS: true,
  auth: {
    user: envs.SMTP_USER,
    pass: envs.SMTP_PASS,
  },
});

export default transporter;
