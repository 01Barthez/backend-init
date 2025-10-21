import prisma from '@/config/prisma/prisma';
import log from '@/services/logging/logger';

import { DELAY } from '../_types/global';

export class UserService {
  static async deleteUnverifiedUsers(): Promise<{ deletedCount: number }> {
    try {
      const result = await prisma.users.deleteMany({
        where: {
          is_verified: false,
          created_at: {
            // Supprimer les comptes non vérifiés de plus de 48h
            lt: new Date(Date.now() - DELAY.TWO_DAY),
          },
        },
      });

      log.info(`Deleted ${result.count} unverified users`);
      return { deletedCount: result.count };
    } catch (error) {
      log.error('Error deleting unverified users:', error);
      throw error;
    }
  }
}
