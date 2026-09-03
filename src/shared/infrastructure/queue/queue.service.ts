/**
 * BullMQ queue factory and repeatable job registration.
 * Connection options are shared with workers.
 */
import { type ConnectionOptions, Queue } from 'bullmq';
import IORedis from 'ioredis';

import { config } from '@/app/config';
import { QUEUE_NAMES } from '@/shared/constants/app.constants';
import { buildRedisOptions } from '@/shared/infrastructure/cache/redis-options';
import { featureFlagService } from '@/shared/infrastructure/feature-flags';
import log from '@/shared/infrastructure/logging/logger';

export const redisConnection: ConnectionOptions = {
  ...buildRedisOptions({ maxRetriesPerRequest: null }),
};

export const createQueue = (name: string) =>
  new Queue(name, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  });

export const mailQueue = createQueue(QUEUE_NAMES.MAIL);
export const backupQueue = createQueue(QUEUE_NAMES.BACKUP);
export const maintenanceQueue = createQueue(QUEUE_NAMES.MAINTENANCE);
export const heavyTasksQueue = createQueue(QUEUE_NAMES.HEAVY_TASKS);

export const getRedisConnection = (): IORedis =>
  new IORedis(buildRedisOptions({ maxRetriesPerRequest: null }));

const clearRepeatableJobs = async (queue: Queue): Promise<void> => {
  const jobs = await queue.getRepeatableJobs();
  await Promise.all(jobs.map((job) => queue.removeRepeatableByKey(job.key)));
};

export const closeQueues = async (): Promise<void> => {
  await Promise.all([
    mailQueue.close(),
    backupQueue.close(),
    maintenanceQueue.close(),
    heavyTasksQueue.close(),
  ]);
};

/** Register cron-driven backup / maintenance jobs (idempotent across restarts). */
export const registerRepeatableJobs = async (): Promise<void> => {
  const role = config.app.processRole;
  if (role === 'api') {
    log.info('Skipping repeatable job registration (PROCESS_ROLE=api)');
    return;
  }

  await clearRepeatableJobs(backupQueue);
  await clearRepeatableJobs(maintenanceQueue);

  const backupEnabled = await featureFlagService.isEnabled('enable_backup', true);
  const maintenanceEnabled = await featureFlagService.isEnabled('enable_maintenance_jobs', true);

  if (backupEnabled) {
    await backupQueue.add(
      'mongodb-backup',
      {},
      {
        repeat: { pattern: config.queue.backup.cron },
        jobId: 'daily-mongodb-backup',
      },
    );
  }

  if (maintenanceEnabled) {
    await maintenanceQueue.add(
      'purge-unverified-users',
      {},
      {
        repeat: { pattern: config.queue.maintenanceCron },
        jobId: 'daily-purge-unverified',
      },
    );

    await maintenanceQueue.add(
      'purge-blacklist',
      {},
      {
        repeat: { pattern: config.queue.blacklistPurgeCron },
        jobId: 'purge-blacklist',
      },
    );

    await maintenanceQueue.add(
      'purge-audit-logs',
      {},
      {
        repeat: { pattern: config.queue.auditPurgeCron },
        jobId: 'purge-audit-logs',
      },
    );
  }

  log.info('Repeatable BullMQ jobs registered', {
    backupEnabled,
    maintenanceEnabled,
    backupCron: config.queue.backup.cron,
    maintenanceCron: config.queue.maintenanceCron,
    blacklistPurgeCron: config.queue.blacklistPurgeCron,
  });
};

export default {
  mailQueue,
  backupQueue,
  maintenanceQueue,
  heavyTasksQueue,
  registerRepeatableJobs,
};
