import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import type { Express, NextFunction, Request, Response } from 'express';

import { config, envs } from '@/app/config';
import { isAdmin } from '@/app/middleware/auth.middleware';
import { authenticate } from '@/app/middleware/authenticate.middleware';
import {
  backupQueue,
  heavyTasksQueue,
  mailQueue,
  maintenanceQueue,
} from '@/shared/infrastructure/queue';

const basicAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
    return res.status(401).send('Authentication required');
  }

  const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
  const [username, password] = credentials.split(':');

  if (username === envs.SWAGGER_USER && password === envs.SWAGGER_PASSWORD) {
    return next();
  }

  return res.status(401).send('Invalid credentials');
};

/**
 * Mounts Bull Board UI at `/admin/queues` (Basic + JWT admin).
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

  /** GET /admin/queues — Bull Board dashboard (HTTP Basic + JWT admin). */
  app.use('/admin/queues', basicAuth, authenticate, isAdmin, serverAdapter.getRouter());
};

export default setupBullBoard;
