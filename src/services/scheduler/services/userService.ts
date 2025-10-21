import prisma from '@/config/prisma/prisma';
import log from '@/services/logging/logger';

import { DELAY } from '../_types/global';

/**
 * Service to manage user-related operations
 */
export class UserService {
  static async deleteUnverifiedUsers(): Promise<{ deletedCount: number }> {
    try {
      const result = await prisma.users.deleteMany({
        where: {
          is_verified: false,
          created_at: {
            // Delete users created more than 2 days ago
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
