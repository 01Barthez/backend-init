import type { Request, Response } from 'express';

import log from '@/services/logging/logger';

import { sendResponse } from './response';

/**
 * Enhanced response helpers with better error tracking and logging
 */
export const response = {
  ok: <T>(req: Request, res: Response, data: T, message = 'Success') =>
    sendResponse(req, res, 200, message, data),

  paginated: (
    req: Request,
    res: Response,
    items: any[],
    totalItems: number,
    totalPages: number,
    currentPage: number,
    message = 'Success',
  ) =>
    sendResponse(
      req,
      res,
      200,
      message,
      null,
      {},
      {
        items,
        totalItems,
        totalPages,
        currentPage,
      },
    ),

  created: <T>(req: Request, res: Response, data: T, message = 'Resource created') =>
    sendResponse(req, res, 201, message, data),

  success: <T>(req: Request, res: Response, data: T, message = 'Success') =>
    sendResponse(req, res, 200, message, data),

  badRequest: (req: Request, res: Response, message = 'Bad request') =>
    sendResponse(req, res, 400, message),

  unauthorized: (req: Request, res: Response, message = 'Unauthorized') =>
    sendResponse(req, res, 401, message),

  forbidden: (req: Request, res: Response, message = 'Forbidden') =>
    sendResponse(req, res, 403, message),

  notFound: (req: Request, res: Response, message = 'Not found') =>
    sendResponse(req, res, 404, message),

  conflict: (req: Request, res: Response, message = 'Conflict') =>
    sendResponse(req, res, 409, message),

  unprocessable: (req: Request, res: Response, message = 'Unprocessable entity') =>
    sendResponse(req, res, 422, message),

  serverError: (req: Request, res: Response, message = 'Internal server error', error?: Error) => {
    if (error) {
      log.error('Server error occurred', {
        message,
        error: error.message,
        stack: error.stack,
        path: req.originalUrl,
        method: req.method,
      });
    }
    return sendResponse(req, res, 500, message);
  },

  serviceUnavailable: (req: Request, res: Response, message = 'Service unavailable') =>
    sendResponse(req, res, 503, message),
};

/**
 * Safe async controller wrapper with error handling
 */
export const asyncHandler = (
  fn: (req: Request, res: Response) => Promise<void | Response<any>>,
) => {
  return async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (error) {
      log.error('Unhandled error in controller', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        path: req.originalUrl,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
      });

      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

      return response.serverError(req, res, errorMessage);
    }
  };
};

/**
 * Validate required fields helper
 */
export const validateRequiredFields = (
  data: Record<string, any>,
  requiredFields: string[],
): { valid: boolean; missing: string[] } => {
  const missing = requiredFields.filter((field) => !data[field]);
  return {
    valid: missing.length === 0,
    missing,
  };
};
