import type { Request, Response } from 'express';

import prisma from '@/config/prisma/client';
import log from '@/services/logging/logger';
import { asyncHandler } from '@/utils/responses/helpers';

const exportUsers = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const users = await prisma.user.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const csvHeader = 'ID,Email,First Name,Last Name,Phone,Active,Verified,Created At\n';
    const csvRows = users
      .map(
        (user) =>
          `${user.id},${user.email},${user.firstName},${user.lastName},${user.phone},${user.isActive},${user.isVerified},${user.createdAt}`,
      )
      .join('\n');
    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');

    log.info('Users exported', { count: users.length });

    return res.send(csv);
  },
);

export default exportUsers;
