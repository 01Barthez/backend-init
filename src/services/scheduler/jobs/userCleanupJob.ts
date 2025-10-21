import type { ScheduledTask } from 'node-cron';

import log from '@/services/logging/logger';

import { scheduler } from '..';
import { schedulerConfig } from '../_config';
import { UserService } from '../services/userService';

export class UserCleanupJob {
  private task: ScheduledTask | null = null;

  async execute(): Promise<void> {
    try {
      await UserService.deleteUnverifiedUsers();
    } catch (job_error) {
      log.error(`********************Error in UserCleanupJob: ${job_error} ********************`);
    }
  }

  start(): void {
    if (this.task) {
      this.task.stop();
    }

    const { schedule, options } = schedulerConfig.userCleanup;
    // this.task = scheduler.ScheduledTask(schedule, this.execute.bind(this), options);
    this.task = scheduler.schedule(schedule, this.execute.bind(this), options);
    log.info('********************UserCleanupJob started********************');
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
    log.info('********************UserCleanupJob stopped********************');
  }
}
