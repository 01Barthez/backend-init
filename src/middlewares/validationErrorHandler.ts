import type { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';

import log from '@/services/logging/logger';
import { response } from '@/utils/responses/helpers';

export function validationErrorHandler(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    log.error(errors.array());
    return response.badRequest(req, res, `Validation failed: ${JSON.stringify(errors.array())} `);
  }
  next();
}
