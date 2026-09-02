import { SendTemplatedMailCommand } from './application/commands/send-templated-mail.command';

export type NotificationsModule = {
  useCases: {
    sendTemplatedMail: SendTemplatedMailCommand;
  };
};

export function createNotificationsModule(): NotificationsModule {
  return {
    useCases: {
      sendTemplatedMail: new SendTemplatedMailCommand(),
    },
  };
}

/** Convenience: queue a templated mail job. */
export async function sendTemplatedMail(
  ...args: Parameters<SendTemplatedMailCommand['execute']>
): Promise<void> {
  await createNotificationsModule().useCases.sendTemplatedMail.execute(...args);
}

export { SendTemplatedMailCommand };

// Re-export shared mail primitives for module consumers
export type {
  MailerPort,
  MailJobPayload,
  MailTemplateName,
  SendMailOptions,
} from '@/shared/infrastructure/mail';
export {
  mailerAdapter,
  queueMail,
  sendMailDirect,
  verifyMailTransport,
} from '@/shared/infrastructure/mail';
