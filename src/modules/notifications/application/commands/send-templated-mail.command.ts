import { queueMail } from '@/shared/infrastructure/mail/mail.service';
import type { MailTemplateName, SendMailOptions } from '@/shared/infrastructure/mail/mail.types';

export type SendTemplatedMailInput = {
  to: string;
  subject: string;
  template: MailTemplateName;
  data?: Record<string, unknown>;
  priority?: number;
};

/**
 * Queues a templated transactional email via shared mail infrastructure.
 * Templates live in `src/shared/infrastructure/mail/templates/`.
 */
export class SendTemplatedMailCommand {
  async execute(input: SendTemplatedMailInput): Promise<void> {
    const payload: SendMailOptions = {
      to: input.to,
      subject: input.subject,
      template: input.template,
      data: input.data ?? {},
      priority: input.priority,
    };
    await queueMail(payload);
  }
}
