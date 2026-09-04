# RBAC module

Vertical slice for roles, permissions, and role assignment.

Authorization style for this template:

- **Routes:** string permissions via `requirePermission` (exact match, or
  `:any` elevating a required `:own`)
- **Ownership / IDOR:** enforced in application use cases (e.g. blog author)
- **No CASL / ability engine** and **no per-row ACL model** — keep the surface
  library-free so projects can plug their own policy engine later

## Layout

```
rbac/
├── domain/            # Types, permissionSatisfied, RbacRepositoryPort
├── application/       # SeedSystemRoles, AssignRole, GetUserAuthContext
├── infrastructure/    # PrismaRbacRepository
├── index.ts           # createRbacModule + rbacService compatibility facade
└── README.md
```

## Seeded roles

| Slug          | Notes                                   |
| ------------- | --------------------------------------- |
| `super-admin` | Bootstrap only; not assignable via HTTP |
| `admin`       | Includes `audit:read` + many `:any`     |
| `user`        | Default on signup (`:own` blog perms)   |
| `guest`       | Assignable via users API                |

Permission catalogue: `SYSTEM_PERMISSIONS` in
`src/shared/constants/app.constants.ts`.

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
  permissionSatisfied,
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
4. **permissionSatisfied** — pure helper; reuse if you add a custom gate.

Role assignment HTTP lives in the users presentation layer
(`PUT /:userId/role`).
