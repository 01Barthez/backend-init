import type { Request, Response } from 'express';

import securityLogger from '@/services/logging/securityLogger';
import { response } from '@/utils/responses/helpers';

const CSPControllers = {
  // Read
  report: async (req: Request, res: Response): Promise<void> => {
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
  },
};

export default CSPControllers;
