/**
 * BullMQ workers bootstrap.
 * Backup handler lives in `@/modules/backup`; mail stays in shared infrastructure.
 */
import { Worker } from 'bullmq';

import { config } from '@/app/config';
import blacklistProvider from '@/modules/auth/infrastructure/providers/blacklist.provider';
import { runMongoBackup } from '@/modules/backup';
import { QUEUE_NAMES } from '@/shared/constants/app.constants';
import { auditRepository } from '@/shared/infrastructure/audit';
import { redisLockService, withDistributedLock } from '@/shared/infrastructure/lock';
import log from '@/shared/infrastructure/logging/logger';
import { sendMailDirect } from '@/shared/infrastructure/mail/mail.service';
import type { MailJobPayload } from '@/shared/infrastructure/mail/mail.types';
import { purgeUnverifiedUsers } from '@/shared/infrastructure/maintenance/user-cleanup.service';
import { redisConnection } from '@/shared/infrastructure/queue/queue.service';

/** Lock TTL must exceed worst-case job duration to prevent overlap. */
const BACKUP_LOCK_TTL_MS = 30 * 60 * 1000;
const MAINTENANCE_LOCK_TTL_MS = 15 * 60 * 1000;

const workers: Worker[] = [];
let workersStarted = false;

export const startWorkers = (): void => {
  if (workersStarted) return;
  if (config.app.processRole === 'api') {
    log.info('Skipping workers (PROCESS_ROLE=api)');
    return;
  }

  workersStarted = true;

  workers.push(
    new Worker<MailJobPayload>(
      QUEUE_NAMES.MAIL,
      async (job) => {
        await sendMailDirect(job.data);
        log.info('Mail job completed', {
          jobId: job.id,
          to: job.data.to,
          requestId: job.data.requestId,
        });
      },
      { connection: redisConnection, concurrency: 5 },
    ),
  );

  workers.push(
    new Worker(
      QUEUE_NAMES.BACKUP,
      async () => {
        await withDistributedLock(redisLockService, 'job:mongodb-backup', BACKUP_LOCK_TTL_MS, () =>
          runMongoBackup(),
        );
      },
      { connection: redisConnection, concurrency: 1 },
    ),
  );

  workers.push(
    new Worker(
      QUEUE_NAMES.MAINTENANCE,
      async (job) => {
        if (job.name === 'purge-unverified-users') {
          await withDistributedLock(
            redisLockService,
            'job:purge-unverified-users',
            MAINTENANCE_LOCK_TTL_MS,
            () => purgeUnverifiedUsers(),
          );
        }
        if (job.name === 'purge-blacklist') {
          await withDistributedLock(
            redisLockService,
            'job:purge-blacklist',
            MAINTENANCE_LOCK_TTL_MS,
            () => blacklistProvider.purgeExpired(),
          );
        }
        if (job.name === 'purge-audit-logs') {
          await withDistributedLock(
            redisLockService,
            'job:purge-audit-logs',
            MAINTENANCE_LOCK_TTL_MS,
            () => auditRepository.purgeOlderThan(config.queue.auditRetentionDays),
          );
        }
      },
      { connection: redisConnection, concurrency: 1 },
    ),
  );

  log.info('BullMQ workers started');
};

export const stopWorkers = async (): Promise<void> => {
  await Promise.all(workers.map((worker) => worker.close()));
  workers.length = 0;
  workersStarted = false;
};

export default startWorkers;
