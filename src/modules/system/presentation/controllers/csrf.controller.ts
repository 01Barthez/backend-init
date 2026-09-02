import type { Request, Response } from 'express';

import { response } from '@/shared/utils/http/responses/helpers';

/**
 * Exposes the CSRF token in the JSON body.
 * Does not overwrite the httpOnly csurf secret cookie (same name would break verification).
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

      response.ok(req, res, { csrfToken }, 'CSRF token issued');
    } catch (error) {
      response.serverError(req, res, `Error generating CSRF token: ${error}`);
    }
  };

  return { sendToken };
}

export type CsrfController = ReturnType<typeof createCsrfController>;
