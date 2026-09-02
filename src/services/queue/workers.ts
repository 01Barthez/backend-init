import { Worker } from 'bullmq';

import { QUEUE_NAMES } from '@/core/constants/app.constants';
import blacklistService from '@/services/auth/blacklist.service';
import { runMongoBackup } from '@/services/backup/mongodb-backup.service';
import log from '@/services/logging/logger';
import { sendMailDirect } from '@/services/mail/mail.service';
import type { MailJobPayload } from '@/services/mail/mail.types';
import { purgeUnverifiedUsers } from '@/services/maintenance/user-cleanup.service';
import { redisConnection } from '@/services/queue/queue.service';

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
        await blacklistService.purgeExpired();
      }
    },
    { connection: redisConnection, concurrency: 1 },
  );

  log.info('BullMQ workers started');
};

export default startWorkers;
