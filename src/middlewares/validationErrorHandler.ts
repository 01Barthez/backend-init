import { response } from '@/utils/responses/helpers';
import { Request, Response, NextFunction } from 'express';

/**
 * Validation Error Handler
 *
 * Captures validation errors (from libraries like Zod or Joi)
 * and sends a clean response to the client.
 */
export function validationErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    if (err.name === 'ValidationError' || err.errors) {
        return response.badRequest(req, res, 'Validation failed');
    }
    next(err);
}
