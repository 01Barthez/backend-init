import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import prisma from '@/config/prisma/prisma';
import log from '@/services/logging/logger';
import { asyncHandler, response } from '@/utils/responses/helpers';

import { invalidateAllUserCaches } from '../_cache/user-cache';

//*& Clear All Users (Development Only)
const clear_all_users = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    if (envs.NODE_ENV !== 'development') {
      return response.forbidden(req, res, 'This action is only allowed in development environment');
    }

    // Delete all users
    await prisma.users.deleteMany({});

    // Clear all user caches
    await invalidateAllUserCaches();

    log.warn('All users cleared from database');

    return response.ok(req, res, null, 'All users cleared successfully');
  },
);

export default clear_all_users;
