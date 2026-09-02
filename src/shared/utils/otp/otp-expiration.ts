import { envs } from '@/app/config';

const OTP_DELAY_MS = envs.OTP_DELAY;

/** Return the absolute expiration timestamp for an OTP issued at `date`. */
export const getOtpExpirationDate = (date: Date): Date => {
  return new Date(date.getTime() + OTP_DELAY_MS);
};
