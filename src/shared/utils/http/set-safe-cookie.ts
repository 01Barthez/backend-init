import type { CookieOptions, Response } from 'express';

import { envs } from '@/app/config';
import log from '@/shared/infrastructure/logging/logger';

/**
 * Set a cookie with project-wide security defaults (secure, httpOnly, sameSite).
 * Host-only when COOKIE_DOMAIN is empty. maxAge is milliseconds.
 */
const setSafeCookie = (res: Response, name: string, value: string, options: CookieOptions = {}) => {
  const size = Buffer.byteLength(value, 'utf8');

  try {
    if (size > 3800) {
      throw new Error(`Cookie too large: ${size} bytes`);
    }

    const domain = (envs.COOKIE_DOMAIN as string)?.trim();

    res.cookie(name, value, {
      ...options,
      secure: envs.COOKIE_SECURE as boolean,
      httpOnly: envs.COOKIE_HTTP_STATUS as boolean,
      sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
      path: '/',
      maxAge: (options.maxAge as number | undefined) ?? (envs.COOKIE_EXPIRES_IN as number),
      ...(domain ? { domain } : {}),
    });
  } catch (error) {
    log.error(`Failed to set cookie "${name}":`, error);
  }
};

export default setSafeCookie;
