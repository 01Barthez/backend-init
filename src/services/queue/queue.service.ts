import { type ConnectionOptions, Queue } from 'bullmq';
import IORedis from 'ioredis';

import { envs } from '@/config/env/env';
import { QUEUE_NAMES } from '@/core/constants/app.constants';
import log from '@/services/logging/logger';

export const redisConnection: ConnectionOptions = {
  host: envs.REDIS_HOST,
  port: envs.REDIS_PORT,
  password: envs.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
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

export const getRedisConnection = (): IORedis => new IORedis(redisConnection as IORedis['options']);

const clearRepeatableJobs = async (queue: Queue): Promise<void> => {
  const jobs = await queue.getRepeatableJobs();
  await Promise.all(jobs.map((job) => queue.removeRepeatableByKey(job.key)));
};

export const registerRepeatableJobs = async (): Promise<void> => {
  // Prevent duplicate schedules after restarts / image rebuilds
  await clearRepeatableJobs(backupQueue);
  await clearRepeatableJobs(maintenanceQueue);

  await backupQueue.add(
    'mongodb-backup',
    {},
    {
      repeat: { pattern: envs.BACKUP_CRON },
      jobId: 'daily-mongodb-backup',
    },
  );

  await maintenanceQueue.add(
    'purge-unverified-users',
    {},
    {
      repeat: { pattern: envs.MAINTENANCE_CRON },
      jobId: 'daily-purge-unverified',
    },
  );

  await maintenanceQueue.add(
    'purge-blacklist',
    {},
    {
      repeat: { pattern: envs.BLACKLIST_PURGE_CRON },
      jobId: 'purge-blacklist',
    },
  );

  log.info('Repeatable BullMQ jobs registered', {
    backupCron: envs.BACKUP_CRON,
    maintenanceCron: envs.MAINTENANCE_CRON,
    blacklistPurgeCron: envs.BLACKLIST_PURGE_CRON,
  });
};

export default {
  mailQueue,
  backupQueue,
  maintenanceQueue,
  heavyTasksQueue,
  registerRepeatableJobs,
};
