# RBAC module

Vertical slice for roles, permissions, ACL resolution, and role assignment.

## Layout

```
rbac/
├── domain/            # Role/permission types, RbacRepositoryPort
├── application/       # SeedSystemRoles, AssignRole, GetUserAuthContext
├── infrastructure/    # PrismaRbacRepository
├── index.ts           # createRbacModule + rbacService compatibility facade
└── README.md
```

## Seeded roles

| Slug          | Notes                                   |
| ------------- | --------------------------------------- |
| `super-admin` | Bootstrap only; not assignable via HTTP |
| `admin`       | Includes `audit:read`                   |
| `user`        | Default on signup                       |
| `guest`       | Assignable via users API                |

Permission catalogue: `SYSTEM_PERMISSIONS` in
`src/shared/constants/app.constants.ts` (includes `audit:read`).

## Dependency rules

| Layer          | May depend on                  | Must not import        |
| -------------- | ------------------------------ | ---------------------- |
| Domain         | shared domain (`AppError`)     | Express, Prisma, Redis |
| Application    | Domain ports                   | Express, Prisma        |
| Infrastructure | Domain ports (implements them) | Presentation           |

## Public API

```ts
import {
  createRbacModule,
  createDefaultRbacDeps,
  rbacService,
} from '@/modules/rbac';

await rbacService.seedSystemRolesAndPermissions();
```

Seeding runs in `bootstrapApplication()` (skipped in tests).

## Extension points

1. **RbacRepositoryPort** — swap Prisma for another store or add caching.
2. **AssignRoleCommand** — used by users module for admin role changes and by
   auth for default role on signup.
3. **rbacService facade** — keeps middlewares working until they inject use
   cases.

Role assignment HTTP lives in the users presentation layer
(`PUT /:userId/role`).
