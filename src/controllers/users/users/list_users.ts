import type { Request, Response } from 'express';

import log from '@/services/logging/logger';
import { asyncHandler, response } from '@/utils/responses/helpers';

import { getCachedUsersList } from '../_cache/user-cache';

//*& List Users
const list_users = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { is_active, is_verified, is_deleted, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;

    // Build filters
    const filters: any = { page: pageNum, limit: limitNum };
    if (is_active !== undefined) filters.is_active = is_active === 'true';
    if (is_verified !== undefined) filters.is_verified = is_verified === 'true';
    if (is_deleted !== undefined) filters.is_deleted = is_deleted === 'true';

    // Get cached users list
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

export default list_users;
