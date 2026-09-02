/**
 * Presentation helper: write a formatted AppError (or unknown) to an Express response.
 */
import type { Response } from 'express';

import { formatErrorResponse } from '@/shared/domain/errors/format-error-response';

export const sendErrorResponse = (
  res: Response,
  error: unknown,
  includeStack = false,
): Response => {
  const { statusCode, body } = formatErrorResponse(error, includeStack);
  return res.status(statusCode).json(body);
};
