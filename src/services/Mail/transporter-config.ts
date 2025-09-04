import nodemailer from 'nodemailer';

import { envs } from '@/config/env/env';

const transporter = nodemailer.createTransport({
  host: envs.SMTP_HOST,
  port: envs.SMTP_PORT,
  secure: true,
  auth: {
    user: envs.SMTP_USER,
    pass: envs.SMTP_PASS,
  },
});

export default transporter;
