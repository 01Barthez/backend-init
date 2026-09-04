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

  const details = body.details as { retryAfterSeconds?: unknown } | undefined;
  const retryAfter = details?.retryAfterSeconds;
  if (statusCode === 429 && typeof retryAfter === 'number' && retryAfter > 0) {
    res.setHeader('Retry-After', String(Math.ceil(retryAfter)));
  }

  return res.status(statusCode).json(body);
};
