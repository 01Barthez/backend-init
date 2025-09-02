import type { Response } from 'express';

import { envs } from '@/config/env/env';
import log from '@/services/logging/logger';

const setSafeCookie = (res: Response, name: string, value: any, options = {}) => {
  const size = Buffer.byteLength(value, 'utf8');

  try {
    if (size > 3800) {
      // 3800 < 4096 for safety margin
      throw new Error(`Cookie too large: ${size} bytes`);
    }

    res.cookie(name, value, {
      ...options,
      secure: envs.COOKIE_SECURE as boolean,
      httpOnly: envs.COOKIE_HTTP_STATUS as boolean,
      sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
      domain: envs.COOKIE_DOMAIN as string,
      path: '/',
      maxAge: envs.COOKIE_EXPIRES_IN,
    });
  } catch (error) {
    log.error(`Failed to set cookie "${name}":`, error);
  }
};

export default setSafeCookie;
