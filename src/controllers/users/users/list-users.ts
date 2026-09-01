import type { Request, Response } from 'express';

import log from '@/services/logging/logger';
import { asyncHandler, response } from '@/utils/responses/helpers';

import { getCachedUsersList } from '../_cache/user-cache';

const listUsers = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { isActive, isVerified, isDeleted, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;

    const filters: any = { page: pageNum, limit: limitNum };
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (isVerified !== undefined) filters.isVerified = isVerified === 'true';
    if (isDeleted !== undefined) filters.isDeleted = isDeleted === 'true';

    const { users, total } = await getCachedUsersList(filters);

    const totalPages = Math.ceil(total / limitNum);

    log.info('Users list retrieved', { page: pageNum, limit: limitNum, total });

    return response.paginated(
      req,
      res,
      users,
      total,
      totalPages,
      pageNum,
      'Users retrieved successfully',
    );
  },
);

export default listUsers;
