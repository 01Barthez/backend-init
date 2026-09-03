import type { NextFunction, Request, Response } from 'express';

import { config } from '@/app/config';
import { response } from '@/shared/utils/http/responses/helpers';

const BYPASS_PREFIXES = ['/health', '/metrics'];

/**
 * Returns 503 when MAINTENANCE_MODE is enabled.
 * Health (live/ready) and metrics stay reachable for probes and alerting.
 */
export const maintenanceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!config.app.maintenanceMode) {
    next();
    return;
  }

  const path = req.path || '';
  if (BYPASS_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    next();
    return;
  }

  response.serviceUnavailable(req, res, 'Service temporarily unavailable for maintenance');
};

export default maintenanceMiddleware;
