import type { Response } from 'express';

import { formatErrorResponse } from '@/shared/domain/errors/format-error-response';
import { getRequestContext } from '@/shared/infrastructure/request-context';

export const sendErrorResponse = (
  res: Response,
  error: unknown,
  includeStack = false,
): Response => {
  const requestId = getRequestContext()?.requestId;
  const { statusCode, body } = formatErrorResponse(error, includeStack, requestId);
  return res.status(statusCode).json(body);
};
