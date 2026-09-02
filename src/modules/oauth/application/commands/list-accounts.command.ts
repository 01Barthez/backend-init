import type { OAuthManager } from '../../infrastructure/manager/oauth-manager.service';
import type { LinkedAccountDto, ListAccountsInput } from '../dto/oauth.dto';

export type ListAccountsQueryDeps = {
  oauthManager: OAuthManager;
};

/**
 * Lists OAuth accounts linked to the authenticated user.
 */
export class ListAccountsQuery {
  constructor(private readonly deps: ListAccountsQueryDeps) {}

  async execute(input: ListAccountsInput): Promise<LinkedAccountDto[]> {
    const accounts = await this.deps.oauthManager.getUserOAuthAccounts(input.userId);

    return accounts.map((account) => ({
      provider: account.provider,
      providerEmail: account.providerEmail,
      linkedAt: account.expiresAt,
    }));
  }
}
