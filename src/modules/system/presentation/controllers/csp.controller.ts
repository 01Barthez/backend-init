import type { Request, Response } from 'express';

import securityLogger from '@/shared/infrastructure/logging/security-logger';
import { response } from '@/shared/utils/http/responses/helpers';

/**
 * Accepts CSP violation reports from browsers.
 */
export function createCspController() {
  const report = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.body?.['csp-report']) {
        securityLogger.warn('CSP Violation', {
          violation: req.body['csp-report'],
          timestamp: new Date().toISOString(),
          userAgent: req.headers['user-agent'],
          ip: req.ip,
        });
      }

      response.success(req, res, 'CSP report received').end();
    } catch (error) {
      response.serverError(req, res, `Failed to process CSP report: ${error}`);
    }
  };

  return { report };
}

export type CspController = ReturnType<typeof createCspController>;
