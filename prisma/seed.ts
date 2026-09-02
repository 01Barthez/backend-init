import prisma from '../src/config/prisma/client';
import { rbacService } from '../src/services/auth/rbac.service';
import log from '../src/services/logging/logger';

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
