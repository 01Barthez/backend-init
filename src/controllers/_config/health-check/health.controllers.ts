import type { Request, Response } from 'express';

import { response } from '@/utils/responses/helpers';

const healthControllers = {
  // Read
  health: async (_req: Request, res: Response): Promise<void> => {
    try {
      response.ok(_req, res, [], 'Health check successful');
    } catch (error) {
      response.serverError(_req, res, `Health check failed: ${error}`);
    }
  },
};

export default healthControllers;
