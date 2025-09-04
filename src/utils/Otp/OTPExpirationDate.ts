import { envs } from '@/config/env/env';

const delay = envs.OTP_DELAY;

export const get_expire_date = (date: Date): Date => {
  return new Date(date.getTime() + delay);
};
