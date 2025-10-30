// Options for node-cron scheduling
export interface NodeCronOptions {
  scheduled?: boolean;
  timezone?: string;
}

// Configuration interface for the scheduler
export interface SchedulerConfig {
  userCleanup: {
    schedule: string;
    options?: NodeCronOptions | undefined;
  };

  backupJob: {
    schedule: string;
    options?: NodeCronOptions | undefined;
  };
  // Add more scheduled tasks here as needed
}
