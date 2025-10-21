import type { SchedulerConfig } from '../_types/global';

// Scheduler configuration
export const schedulerConfig: SchedulerConfig = {
  // User cleanup job configuration
  userCleanup: {
    schedule: '0 */12 * * *', // Toutes les 12 heures
    options: {
      timezone: 'Africa/Douala',
    },
    // schedule: '* * * * *', // Every minute (for testing)
  },

  // Add more scheduled tasks configurations here as needed
};
