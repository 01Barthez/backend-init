import type { Request, Response } from 'express';

import { config } from '@/app/config';
import { response } from '@/shared/utils/http/responses/helpers';

/**
 * Exposes the CSRF token in the JSON body.
 * Does not overwrite the httpOnly csurf secret cookie (same name would break verification).
 * When CSRF is disabled (`ALLOW_CSRF_PROTECTION=false`), returns 200 with `csrfEnabled: false`.
 */
export function createCsrfController() {
  const sendToken = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!config.security.csrf.enabled) {
        response.ok(
          req,
          res,
          { csrfEnabled: false, csrfToken: null },
          'CSRF protection is disabled',
        );
        return;
      }

      if (!req.csrfToken) {
        throw new Error('CSRF protection is not properly configured');
      }

      const csrfToken = req.csrfToken();
      if (!csrfToken) {
        throw new Error('Failed to generate CSRF token');
      }

      response.ok(req, res, { csrfEnabled: true, csrfToken }, 'CSRF token issued');
    } catch (error) {
      response.serverError(req, res, `Error generating CSRF token: ${error}`);
    }
  };

  return { sendToken };
}

export type CsrfController = ReturnType<typeof createCsrfController>;
