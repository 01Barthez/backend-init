import prisma from '@/config/prisma/client';
import log from '@/services/logging/logger';

/** Removes unverified users older than 1 hour. Runs daily at midnight via BullMQ. */
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
