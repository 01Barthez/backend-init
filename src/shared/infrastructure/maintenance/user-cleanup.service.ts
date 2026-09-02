/**
 * Maintenance job: purge stale unverified accounts.
 * Scheduled via BullMQ (see shared/infrastructure/queue).
 */
import prisma from '@/shared/infrastructure/database/prisma.client';
import log from '@/shared/infrastructure/logging/logger';

/** Removes unverified users older than 1 hour. */
export const purgeUnverifiedUsers = async (): Promise<number> => {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000);

  const result = await prisma.user.deleteMany({
    where: {
      isVerified: false,
      createdAt: { lt: cutoff },
    },
  });

  log.info('Unverified users purged', { count: result.count, cutoff });
  return result.count;
};

export default purgeUnverifiedUsers;
