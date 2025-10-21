import type { ScheduledTask } from 'node-cron';

import log from '@/services/logging/logger';

import { scheduler } from '..';
import { schedulerConfig } from '../_config';
import { UserService } from '../services/userService';

/**
 * Job to clean up unverified users
 */
export class UserCleanupJob {
  private task: ScheduledTask | null = null;

  // Execute the cleanup job
  async execute(): Promise<void> {
    try {
      await UserService.deleteUnverifiedUsers();
    } catch (job_error) {
      log.error(`********************Error in UserCleanupJob: ${job_error} ********************`);
    }
  }

  // Start the cleanup job
  start(): void {
    if (this.task) {
      this.task.stop();
    }

    const { schedule, options } = schedulerConfig.userCleanup;
    // this.task = scheduler.ScheduledTask(schedule, this.execute.bind(this), options);
    this.task = scheduler.schedule(schedule, this.execute.bind(this), options);
    log.info('********************UserCleanupJob started********************');
  }

  // Stop the cleanup job
  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
    log.info('********************UserCleanupJob stopped********************');
  }
}
