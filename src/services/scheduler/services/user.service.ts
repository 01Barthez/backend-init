import prisma from '@/config/prisma/prisma';
import log from '@/services/logging/logger';

import { DELAY } from '../_types/global';

export class UserService {
  static async deleteUnverifiedUsers(): Promise<{ deletedCount: number }> {
    try {
      const result = await prisma.user.deleteMany({
        where: {
          isVerified: false,
          createdAt: {
            lt: new Date(Date.now() - DELAY.TWO_DAY),
          },
        },
      });

      log.info(`Deleted ${result.count} unverified users`);
      return { deletedCount: result.count };
    } catch (service_error) {
      log.error('Error deleting unverified users:', service_error);
      throw service_error;
    }
  }
}
