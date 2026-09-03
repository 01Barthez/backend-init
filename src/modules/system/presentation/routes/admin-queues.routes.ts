import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import type { Express } from 'express';

import { config } from '@/app/config';
import { adminBasicAuth } from '@/app/middleware/admin-basic-auth.middleware';
import { isAdmin } from '@/app/middleware/auth.middleware';
import { authenticate } from '@/app/middleware/authenticate.middleware';
import {
  backupQueue,
  heavyTasksQueue,
  mailQueue,
  maintenanceQueue,
} from '@/shared/infrastructure/queue';

/**
 * Mounts Bull Board UI at `/admin/queues` (HTTP Basic + JWT admin).
 */
export const setupBullBoard = (app: Express): void => {
  if (config.app.isTest) return;

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [
      new BullMQAdapter(mailQueue),
      new BullMQAdapter(backupQueue),
      new BullMQAdapter(maintenanceQueue),
      new BullMQAdapter(heavyTasksQueue),
    ],
    serverAdapter,
  });

  app.use('/admin/queues', adminBasicAuth, authenticate, isAdmin, serverAdapter.getRouter());
};

export default setupBullBoard;
