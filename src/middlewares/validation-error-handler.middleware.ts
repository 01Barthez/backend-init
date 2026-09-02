import type { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';

import { AppError } from '@/utils/errors/app-error';

export const validationErrorHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    next(
      AppError.badRequest(
        'Validation failed',
        errors.array().map((e) => ({
          field: 'path' in e ? e.path : undefined,
          message: e.msg,
        })),
      ),
    );
    return;
  }

  next();
};

export default validationErrorHandler;
