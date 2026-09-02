import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AssignRoleCommand } from '@/modules/rbac/application/commands/assign-role.command';
import type { RbacRepositoryPort } from '@/modules/rbac/domain/repositories/rbac.repository';
import { SYSTEM_ROLES } from '@/shared/constants/app.constants';
import { AppError } from '@/shared/domain/errors/app-error';

describe('AssignRoleCommand', () => {
  let rbacRepository: RbacRepositoryPort;
  let command: AssignRoleCommand;

  beforeEach(() => {
    rbacRepository = {
      findRoleBySlug: vi.fn().mockResolvedValue({
        id: 'role-1',
        name: 'User',
        slug: SYSTEM_ROLES.USER,
        description: null,
        isSystem: true,
        isActive: true,
      }),
      assignRole: vi.fn().mockResolvedValue(undefined),
      seedSystemRolesAndPermissions: vi.fn(),
      getUserAuthContext: vi.fn(),
    };

    command = new AssignRoleCommand({ rbacRepository });
  });

  it('assigns an existing role', async () => {
    await command.execute({ userId: 'u1', roleSlug: SYSTEM_ROLES.USER });

    expect(rbacRepository.assignRole).toHaveBeenCalledWith('u1', SYSTEM_ROLES.USER);
  });

  it('no-ops when role is missing and requireExists is false', async () => {
    vi.mocked(rbacRepository.findRoleBySlug).mockResolvedValue(null);

    await expect(
      command.execute({ userId: 'u1', roleSlug: 'unknown', requireExists: false }),
    ).resolves.toBeUndefined();
    expect(rbacRepository.assignRole).not.toHaveBeenCalled();
  });

  it('throws when role is missing and requireExists is true', async () => {
    vi.mocked(rbacRepository.findRoleBySlug).mockResolvedValue(null);

    await expect(
      command.execute({ userId: 'u1', roleSlug: 'unknown', requireExists: true }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
