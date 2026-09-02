import type { NextFunction, Request, Response } from 'express';

import { response } from '@/shared/utils/http/responses/helpers';

const notFoundRoutes = (req: Request, res: Response, _next: NextFunction) => {
  return response.notFound(req, res, 'Route not found');
};

export default notFoundRoutes;
