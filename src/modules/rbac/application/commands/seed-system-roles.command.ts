import log from '@/shared/infrastructure/logging/logger';

import type { RbacRepositoryPort } from '../../domain/repositories/rbac.repository';

export type SeedSystemRolesDeps = {
  rbacRepository: RbacRepositoryPort;
};

/**
 * Seeds built-in roles and permissions at application bootstrap.
 * Safe to call repeatedly — repository upserts are idempotent.
 */
export class SeedSystemRolesCommand {
  constructor(private readonly deps: SeedSystemRolesDeps) {}

  async execute(): Promise<void> {
    await this.deps.rbacRepository.seedSystemRolesAndPermissions();
    log.info('System RBAC roles and permissions seeded');
  }
}
