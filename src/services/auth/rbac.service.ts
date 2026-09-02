import prisma from '@/config/prisma/client';
import { SYSTEM_PERMISSIONS, SYSTEM_ROLES } from '@/core/constants/app.constants';
import log from '@/services/logging/logger';

export const rbacService = {
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
          'blog:read',
          'blog:update:any',
          'blog:delete:any',
          'blog:publish',
        ],
      },
      {
        name: 'User',
        slug: SYSTEM_ROLES.USER,
        description: 'Standard user',
        perms: ['blog:read', 'blog:create', 'blog:update:own', 'blog:delete:own', 'blog:publish'],
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

    log.info('System RBAC roles and permissions seeded');
  },

  async assignDefaultRole(userId: string, slug = SYSTEM_ROLES.USER): Promise<void> {
    const role = await prisma.role.findUnique({ where: { slug } });
    if (!role) return;

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      create: { userId, roleId: role.id },
      update: {},
    });
  },

  async getUserAuthContext(userId: string): Promise<{ permissions: string[]; roles: string[] }> {
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

    const aclRules = await prisma.aclRule.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    for (const rule of aclRules) {
      if (rule.effect === 'ALLOW') {
        permissions.add(`${rule.resource}:${rule.action}`);
      } else {
        permissions.delete(`${rule.resource}:${rule.action}`);
      }
    }

    return { permissions: [...permissions], roles };
  },

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const ctx = await this.getUserAuthContext(userId);
    if (ctx.roles.includes(SYSTEM_ROLES.SUPER_ADMIN)) return true;
    return ctx.permissions.includes(permission);
  },

  async hasAnyRole(userId: string, slugs: string[]): Promise<boolean> {
    const ctx = await this.getUserAuthContext(userId);
    return slugs.some((slug) => ctx.roles.includes(slug));
  },

  async canAccessResource(
    userId: string,
    permission: string,
    resourceOwnerId?: string,
  ): Promise<boolean> {
    const ctx = await this.getUserAuthContext(userId);
    if (ctx.roles.includes(SYSTEM_ROLES.SUPER_ADMIN)) return true;
    if (ctx.permissions.includes(permission.replace(':own', ':any'))) return true;
    if (permission.endsWith(':own') && resourceOwnerId === userId) {
      return ctx.permissions.includes(permission);
    }
    return ctx.permissions.includes(permission);
  },
};

export default rbacService;
