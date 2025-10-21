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
  // Add more scheduled tasks here as needed
}

// Delay constants in milliseconds
export const DELAY = {
  ONE_DAY: 0,
  TWO_DAY: 48 * 60 * 60 * 1000,
} as const;
