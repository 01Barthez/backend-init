import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import { response } from '@/utils/responses/helpers';
import setSafeCookie from '@/utils/setSafeCookie';

const CSRFControllers = {
  // Read
  sendToken: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.csrfToken) {
        throw new Error('CSRF protection is not properly configured');
      }

      const csrfToken = req.csrfToken();

      if (!csrfToken) {
        throw new Error('Failed to generate CSRF token');
      }

      // send token through a secure cookie
      setSafeCookie(res, envs.CSRF_COOKIE_NAME, csrfToken, {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/',
      });

      response.ok(req, res, { csrfToken: req.csrfToken() }, 'CSRF Token successfuly send');
    } catch (error) {
      response.serverError(req, res, `Error generating CSRF token: ${error}`);
    }
  },
};

export default CSRFControllers;
