import log from '@services/logging/logger';
import type { Request, Response } from 'express';

interface MetaData {
  path: string;
  method: string;
  url: string;
  ip?: string;
  userAgent: string | undefined;
  responseTime: string;
  timestamp: string;
  [key: string]: any;
}

interface StandardResponse<T> {
  success: boolean;
  data: T | null;
  statusCode: number;
  message: string;
  meta: MetaData;
}

export function sendResponse<T>(
  req: Request,
  res: Response,
  statusCode: number,
  message: string,
  data: T | null = null,
  extraMeta: Record<string, any> = {},
  pagination?: {
    items: any[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
  },
) {
  const startTime = (req as any).startTime;
  const endTime = Date.now();
  const responseTime = startTime ? `${endTime - startTime}ms` : '0ms';

  const meta: MetaData = {
    path: req.originalUrl,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    responseTime,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    ...extraMeta,
  };

  const payload: StandardResponse<any> = {
    success: statusCode < 400,
    data: pagination
      ? {
          items: pagination.items,
          totalItems: pagination.totalItems,
          totalPages: pagination.totalPages,
          currentPage: pagination.currentPage,
        }
      : data,
    statusCode,
    message,
    meta,
  };

  const level = getLogLevel(statusCode);
  log[level]('Response sent', payload);

  return res.status(statusCode).json(payload);
}

function getLogLevel(statusCode: number): 'info' | 'warn' | 'error' {
  if (statusCode >= 500) return 'error';
  if (statusCode >= 400) return 'warn';
  return 'info';
}
