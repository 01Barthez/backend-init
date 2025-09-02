import type { NextFunction, Request, Response } from 'express';

export const requestTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  (req as any).startTime = startTime;

  res.on('finish', () => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
  });

  next();
};
