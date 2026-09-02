import type { Request, Response } from 'express';

import { response } from '@/shared/utils/http/responses/helpers';

/**
 * Liveness / readiness style health check.
 */
export function createHealthController() {
  const health = async (_req: Request, res: Response): Promise<void> => {
    try {
      response.ok(_req, res, [], 'Health check successful');
    } catch (error) {
      response.serverError(_req, res, `Health check failed: ${error}`);
    }
  };

  return { health };
}

export type HealthController = ReturnType<typeof createHealthController>;
