import { AppError } from '@/shared/domain/errors/app-error';

import type { TokenRepositoryPort } from '../../domain/repositories/token.repository';
import type { AuthSessionSummary } from '../../domain/types/auth.types';

export type ListSessionsDeps = {
  tokenRepository: TokenRepositoryPort;
};

/**
 * Lists refresh-token families for the authenticated user.
 */
export class ListSessionsQuery {
  constructor(private readonly deps: ListSessionsDeps) {}

  async execute(userId: string): Promise<AuthSessionSummary[]> {
    if (!userId) {
      throw AppError.unauthorized('Authentication required');
    }
    return this.deps.tokenRepository.listSessionsForUser(userId);
  }
}
