import type { Request, Response } from 'express';

import log from '@/services/logging/logger';
import { asyncHandler, response } from '@/utils/responses/helpers';

import { getCachedUsersSearch } from '../_cache/user-cache';

//*& Search Users
const search_user = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { search } = req.query;

    if (!search) {
      return response.badRequest(req, res, 'Search query is required');
    }

    // Get cached search results
    const users = (await getCachedUsersSearch(search as string)) || [];

    log.info('User search completed', { query: search, results: users });

    return response.ok(req, res, users, `Found users`);
  },
);

export default search_user;
