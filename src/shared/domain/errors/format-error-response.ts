import { isAppError } from './app-error';

/**
 * Stable JSON shape returned to API clients on failure.
 * Kept next to the formatter — not on the domain error type itself.
 */
export type ErrorResponseBody = {
  success: false;
  message: string;
  code?: string;
  details?: unknown;
  stack?: string;
};

export type FormattedError = {
  statusCode: number;
  body: ErrorResponseBody;
};

/**
 * Map any thrown value to a consistent HTTP status + body.
 *
 * - Known `AppError` → status/code/details as thrown
 * - Validation libraries (`name === 'ValidationError'`) → 400
 * - Everything else → 500; message/stack only when `includeStack` (dev)
 *
 * Pure function: no Express types, safe to unit-test in isolation.
 */
export const formatErrorResponse = (error: unknown, includeStack = false): FormattedError => {
  if (isAppError(error)) {
    return {
      statusCode: error.statusCode,
      body: {
        success: false,
        message: error.message,
        code: error.code,
        details: error.details,
        ...(includeStack ? { stack: error.stack } : {}),
      },
    };
  }

  if (error instanceof Error && error.name === 'ValidationError') {
    return {
      statusCode: 400,
      body: {
        success: false,
        message: error.message,
        code: 'VALIDATION_ERROR',
      },
    };
  }

  const message = error instanceof Error ? error.message : 'An unexpected error occurred';

  return {
    statusCode: 500,
    body: {
      success: false,
      message: includeStack ? message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(includeStack && error instanceof Error ? { stack: error.stack } : {}),
    },
  };
};
