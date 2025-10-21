// src/services/scheduler/index.ts
import log from '@services/logging/logger';
import { schedule } from 'node-cron';

import { UserCleanupJob } from './jobs/userCleanupJob';

class Scheduler {
  private jobs: { [key: string]: any } = {};

  init() {
    try {
      // Initialiser et démarrer les jobs
      this.jobs.userCleanup = new UserCleanupJob();
      this.jobs.userCleanup.start();

      log.info('Scheduler initialized successfully');
    } catch (error) {
      log.error('Failed to initialize scheduler:', error);
      throw error;
    }
  }

  stopAll() {
    Object.values(this.jobs).forEach((job) => {
      if (typeof job.stop === 'function') {
        job.stop();
      }
    });
    log.info('All scheduled jobs stopped');
  }

  schedule(cronExpression: string, task: () => Promise<void>, options?: any) {
    return schedule(cronExpression, task, options);
  }
}

export const scheduler = new Scheduler();
