import type { NextFunction, Request, Response } from 'express';

import { response } from '@/utils/responses/helpers';

const notFoundRoutes = (req: Request, res: Response, next: NextFunction) => {
  return response.notFound(req, res, 'Route not found');
};

export default notFoundRoutes;
