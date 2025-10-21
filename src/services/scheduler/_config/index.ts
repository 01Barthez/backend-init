import type { SchedulerConfig } from '../_types/global';

export const schedulerConfig: SchedulerConfig = {
  userCleanup: {
    schedule: '0 */12 * * *', // Toutes les 12 heures
    // schedule: '* * * * *', // Toutes les minutes pour le test
    options: {
      timezone: 'Africa/Douala',
    },
  },
};
