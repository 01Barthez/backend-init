/**
 * BullMQ workers bootstrap.
 * Backup handler lives in `@/modules/backup`; mail stays in shared infrastructure.
 */
import { Worker } from 'bullmq';

import { runMongoBackup } from '@/modules/backup';
import blacklistProvider from '@/modules/auth/infrastructure/providers/blacklist.provider';
import { purgeUnverifiedUsers } from '@/shared/infrastructure/maintenance/user-cleanup.service';
import { QUEUE_NAMES } from '@/shared/constants/app.constants';
import log from '@/shared/infrastructure/logging/logger';
import { sendMailDirect } from '@/shared/infrastructure/mail/mail.service';
import type { MailJobPayload } from '@/shared/infrastructure/mail/mail.types';
import { redisConnection } from '@/shared/infrastructure/queue/queue.service';

let workersStarted = false;

export const startWorkers = (): void => {
  if (workersStarted) return;
  workersStarted = true;

  new Worker<MailJobPayload>(
    QUEUE_NAMES.MAIL,
    async (job) => {
      await sendMailDirect(job.data);
      log.info('Mail job completed', { jobId: job.id, to: job.data.to });
    },
    { connection: redisConnection, concurrency: 5 },
  );

  new Worker(
    QUEUE_NAMES.BACKUP,
    async () => {
      await runMongoBackup();
    },
    { connection: redisConnection, concurrency: 1 },
  );

  new Worker(
    QUEUE_NAMES.MAINTENANCE,
    async (job) => {
      if (job.name === 'purge-unverified-users') {
        await purgeUnverifiedUsers();
      }
      if (job.name === 'purge-blacklist') {
        await blacklistProvider.purgeExpired();
      }
    },
    { connection: redisConnection, concurrency: 1 },
  );

  log.info('BullMQ workers started');
};

export default startWorkers;
