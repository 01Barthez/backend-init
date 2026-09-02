import type { Request, Response } from 'express';

import { envs } from '@/app/config';
import { response } from '@/shared/utils/http/responses/helpers';
import setSafeCookie from '@/shared/utils/http/set-safe-cookie';

/**
 * Issues a CSRF token cookie + response body for clients.
 */
export function createCsrfController() {
  const sendToken = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.csrfToken) {
        throw new Error('CSRF protection is not properly configured');
      }

      const csrfToken = req.csrfToken();

      if (!csrfToken) {
        throw new Error('Failed to generate CSRF token');
      }

      setSafeCookie(res, envs.CSRF_COOKIE_NAME, csrfToken, {
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });

      response.ok(req, res, { csrfToken: req.csrfToken() }, 'CSRF Token successfuly send');
    } catch (error) {
      response.serverError(req, res, `Error generating CSRF token: ${error}`);
    }
  };

  return { sendToken };
}

export type CsrfController = ReturnType<typeof createCsrfController>;
