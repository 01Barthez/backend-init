import { envs } from '@/config/env/env';

const OTP_DELAY_MS = envs.OTP_DELAY;

export const getOtpExpirationDate = (date: Date): Date => {
  return new Date(date.getTime() + OTP_DELAY_MS);
};
