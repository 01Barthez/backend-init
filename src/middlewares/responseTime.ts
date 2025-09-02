import type { NextFunction, Request, Response } from 'express';

export const requestTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  (req as any).startTime = startTime;

  res.on('finish', () => {
    const endTime = Date.now();
    // eslint-disable-next-line unused-imports/no-unused-vars
    const responseTime = endTime - startTime;
  });

  next();
};
