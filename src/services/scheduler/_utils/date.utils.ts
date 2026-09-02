import { format, subDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

import backupConfig from '../_config/backup';

export function getCurrentDatePath(): string {
  const now = toZonedTime(new Date(), backupConfig.timezone);
  return format(now, 'yyyy-MM-dd');
}

export function getOldBackupDates(daysToKeep: number): string[] {
  const dates: string[] = [];
  const now = toZonedTime(new Date(), backupConfig.timezone);

  for (let i = daysToKeep; i < daysToKeep + 30; i++) {
    const date = subDays(now, i);
    dates.push(format(date, 'yyyy-MM-dd'));
  }

  return dates;
}
