import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import prisma from '@/config/prisma/prisma';
import log from '@/services/logging/logger';
import { asyncHandler, response } from '@/utils/responses/helpers';

import { invalidateAllUserCaches } from '../_cache/user-cache';

const clearAllUsers = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    if (envs.NODE_ENV !== 'development') {
      return response.forbidden(req, res, 'This action is only allowed in development environment');
    }

    await prisma.user.deleteMany({});

    await invalidateAllUserCaches();

    log.warn('All users cleared from database');

    return response.ok(req, res, null, 'All users cleared successfully');
  },
);

export default clearAllUsers;
