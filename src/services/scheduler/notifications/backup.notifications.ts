import { MAIL } from '@/core/constant/global';
import send_mail from '@/services/Mail/send-mail';
import log from '@/services/logging/logger';

import backupConfig from '../_config/backup';

export class NotificationService {
  async sendBackupSuccess(details: {
    backupPath: string;
    size: string;
    duration: string;
  }): Promise<void> {
    const email = backupConfig.email.to;
    const date = new Date().toLocaleString('fr-FR', {
      timeZone: 'Africa/Douala',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    try {
      await send_mail(
        backupConfig.email.to,
        MAIL.BACKUP_NOTIFICATION_SUBJECT_SUCCESS,
        'backup_success_notification',
        {
          date,
          path: details.backupPath,
          size: details.size,
          duration: details.duration,
        },
      );
      log.info('Backup successfull send', { email });
    } catch (mailError: any) {
      log.error('Backup success notification failed to send', { email, error: mailError.message });
    }
  }

  async sendBackupError(error: Error): Promise<void> {
    const email = backupConfig.email.to;
    const date = new Date().toLocaleString('fr-FR', {
      timeZone: 'Africa/Douala',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    try {
      await send_mail(email, MAIL.BACKUP_NOTIFICATION_SUBJECT_FAILED, 'backup_error_notification', {
        date,
        errorMessage: error.message,
        stackTrace: error.stack,
      });
      log.info('Backup failed', { email });
    } catch (mailError: any) {
      log.error('Backup failed notification', { email, error: mailError.message });
    }
  }
}

export const notificationService = new NotificationService();
