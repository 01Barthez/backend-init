import type { NextFunction, Request, Response } from 'express';

export interface PaginationQuery {
  page: number;
  limit: number;
  skip: number;
}

declare global {
  namespace Express {
    interface Request {
      pagination?: PaginationQuery;
    }
  }
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export const paginationMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const page = Math.max(1, parseInt(String(req.query.page ?? DEFAULT_PAGE), 10) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(String(req.query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
  );

  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit,
  };

  next();
};

export default paginationMiddleware;
