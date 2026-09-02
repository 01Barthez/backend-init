import type { RbacRepositoryPort } from '../../domain/repositories/rbac.repository';
import type { UserAuthContext } from '../../domain/types/rbac.types';

export type GetUserAuthContextDeps = {
  rbacRepository: RbacRepositoryPort;
};

/**
 * Returns the caller's effective roles and permissions (roles + ACL).
 */
export class GetUserAuthContextQuery {
  constructor(private readonly deps: GetUserAuthContextDeps) {}

  execute(userId: string): Promise<UserAuthContext> {
    return this.deps.rbacRepository.getUserAuthContext(userId);
  }
}
