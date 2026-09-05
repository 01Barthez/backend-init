import { SYSTEM_PERMISSIONS, SYSTEM_ROLES } from '@/shared/constants/app.constants';
import { prisma } from '@/shared/infrastructure/database';

import type { RbacRepositoryPort } from '../../domain/repositories/rbac.repository';
import type { RoleEntity, UserAuthContext } from '../../domain/types/rbac.types';

const toRoleEntity = (row: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
}): RoleEntity => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  isSystem: row.isSystem,
  isActive: row.isActive,
});

/**
 * Prisma-backed RBAC repository.
 * Owns all role / permission / ACL persistence for the rbac module.
 */
export class PrismaRbacRepository implements RbacRepositoryPort {
  async seedSystemRolesAndPermissions(): Promise<void> {
    await Promise.all(
      SYSTEM_PERMISSIONS.map((perm) =>
        prisma.permission.upsert({
          where: { name: perm.name },
          create: { ...perm, isSystem: true },
          update: {},
        }),
      ),
    );

    const roleDefs = [
      {
        name: 'Super Admin',
        slug: SYSTEM_ROLES.SUPER_ADMIN,
        description: 'Full system access',
        perms: SYSTEM_PERMISSIONS.map((p) => p.name),
      },
      {
        name: 'Admin',
        slug: SYSTEM_ROLES.ADMIN,
        description: 'User administration',
        perms: [
          'user:read:any',
          'user:update:any',
          'user:delete:any',
          'user:export',
          'user:role:assign',
          'blog:update:any',
          'blog:delete:any',
          'blog:publish',
          'audit:read',
        ],
      },
      {
        name: 'User',
        slug: SYSTEM_ROLES.USER,
        description: 'Standard user',
        perms: ['blog:create', 'blog:update:own', 'blog:delete:own', 'blog:publish'],
      },
      {
        name: 'Guest',
        slug: SYSTEM_ROLES.GUEST,
        description: 'Read-only public access',
        perms: ['blog:read'],
      },
    ];

    await Promise.all(
      roleDefs.map(async (roleDef) => {
        const role = await prisma.role.upsert({
          where: { slug: roleDef.slug },
          create: {
            name: roleDef.name,
            slug: roleDef.slug,
            description: roleDef.description,
            isSystem: true,
          },
          update: {},
        });

        await Promise.all(
          roleDef.perms.map(async (permName) => {
            const permission = await prisma.permission.findUnique({ where: { name: permName } });
            if (!permission) return;

            await prisma.rolePermission.upsert({
              where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
              create: { roleId: role.id, permissionId: permission.id },
              update: {},
            });
          }),
        );
      }),
    );
  }

  async findRoleBySlug(slug: string): Promise<RoleEntity | null> {
    const role = await prisma.role.findUnique({ where: { slug } });
    return role ? toRoleEntity(role) : null;
  }

  /**
   * Replaces all UserRole rows for the user with a single role.
   * Prevents privilege stacking (e.g. admin+user after a "demotion").
   */
  async assignRole(userId: string, slug: string): Promise<void> {
    const role = await prisma.role.findUnique({ where: { slug } });
    if (!role) return;

    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId } }),
      prisma.userRole.create({ data: { userId, roleId: role.id } }),
    ]);
  }

  async countUsersWithRole(slug: string): Promise<number> {
    const role = await prisma.role.findUnique({ where: { slug } });
    if (!role) return 0;
    return prisma.userRole.count({ where: { roleId: role.id } });
  }

  async getUserAuthContext(userId: string): Promise<UserAuthContext> {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
      },
    });

    const roles = userRoles.map((ur) => ur.role.slug);
    const permissions = new Set<string>();

    for (const ur of userRoles) {
      if (!ur.role.isActive) continue;
      for (const rp of ur.role.rolePermissions) {
        permissions.add(rp.permission.name);
      }
    }

    return { permissions: [...permissions], roles };
  }

  async countUsersWithAnyRole(slugs: string[]): Promise<number> {
    if (slugs.length === 0) return 0;

    const roles = await prisma.role.findMany({
      where: { slug: { in: slugs } },
      select: { id: true },
    });
    if (roles.length === 0) return 0;

    const rows = await prisma.userRole.findMany({
      where: { roleId: { in: roles.map((role) => role.id) } },
      select: { userId: true },
    });
    return new Set(rows.map((row) => row.userId)).size;
  }
}
