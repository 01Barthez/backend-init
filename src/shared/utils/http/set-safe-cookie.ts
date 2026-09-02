import type { Response } from 'express';

import { envs } from '@/app/config';
import log from '@/shared/infrastructure/logging/logger';

/**
 * Set a cookie with project-wide security defaults (secure, httpOnly, sameSite, domain).
 * Rejects payloads that would exceed typical browser cookie size limits.
 */
const setSafeCookie = (res: Response, name: string, value: any, options = {}) => {
  const size = Buffer.byteLength(value, 'utf8');

  try {
    if (size > 3800) {
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
