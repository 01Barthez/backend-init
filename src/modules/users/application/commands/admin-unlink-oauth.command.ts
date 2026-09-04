import { AppError } from '@/shared/domain/errors/app-error';
import type { AuditPort } from '@/shared/infrastructure/audit';

import type { UsersRepositoryPort } from '../../domain/repositories/users.repository';

export type AdminUnlinkOAuthDeps = {
  usersRepository: UsersRepositoryPort;
  /** Delegates to OAuthManager.unlinkOAuthAccount via a late import. */
  unlinkOAuthAccount: (userId: string, provider: string) => Promise<void>;
  audit?: AuditPort;
};

export type AdminUnlinkOAuthInput = {
  actorId: string;
  targetUserId: string;
  provider: string;
};

const VALID_PROVIDERS = [
  'google',
  'github',
  'facebook',
  'instagram',
  'twitter',
  'linkedin',
  'telegram',
] as const;

/**
 * Admin command: forcibly unlink an OAuth provider from any user account.
 * Requires `user:update:any` permission. Audited.
 */
export class AdminUnlinkOAuthCommand {
  constructor(private readonly deps: AdminUnlinkOAuthDeps) {}

  async execute(input: AdminUnlinkOAuthInput): Promise<void> {
    const providerLower = input.provider?.toLowerCase();
    if (!VALID_PROVIDERS.includes(providerLower as (typeof VALID_PROVIDERS)[number])) {
      throw AppError.badRequest(
        `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}`,
      );
    }

    const user = await this.deps.usersRepository.findLookupById(input.targetUserId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    await this.deps.unlinkOAuthAccount(input.targetUserId, providerLower.toUpperCase());

    await this.deps.audit?.record({
      actorId: input.actorId,
      action: 'user.oauth.unlink',
      resource: 'user',
      resourceId: input.targetUserId,
      metadata: { provider: providerLower },
    });
  }
}
