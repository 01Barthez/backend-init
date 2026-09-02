import { rbacService } from '@/modules/rbac';
import prisma from '@/shared/infrastructure/database/prisma.client';
import log from '@/shared/infrastructure/logging/logger';

const main = async (): Promise<void> => {
  await rbacService.seedSystemRolesAndPermissions();
  log.info('Prisma seed completed');
};

main()
  .catch((error) => {
    log.error('Prisma seed failed', { error });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
