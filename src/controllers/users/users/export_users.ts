import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import log from '@/services/logging/logger';
import { asyncHandler } from '@/utils/responses/helpers';

//*& Export Users
const export_users = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    // Get all users (no cache for exports to ensure fresh data)
    const users = await prisma.users.findMany({
      where: { is_deleted: false },
      select: {
        user_id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        is_active: true,
        is_verified: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // Generate CSV
    const csvHeader = 'ID,Email,First Name,Last Name,Phone,Active,Verified,Created At\n';
    const csvRows = users
      .map(
        (user) =>
          `${user.user_id},${user.email},${user.first_name},${user.last_name},${user.phone},${user.is_active},${user.is_verified},${user.created_at}`,
      )
      .join('\n');
    const csv = csvHeader + csvRows;

    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');

    log.info('Users exported', { count: users.length });

    return res.send(csv);
  },
);

export default export_users;
