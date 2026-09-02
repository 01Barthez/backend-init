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

// Bootstrap (server.ts)
await rbacService.seedSystemRolesAndPermissions();

// Custom DI (tests)
const rbac = createRbacModule(
  createDefaultRbacDeps({
    rbacRepository: fakeRepo,
  }),
);
```

## Extension points

1. **RbacRepositoryPort** — swap Prisma for another store or add caching.
2. **AssignRoleCommand** — used by users module for admin role changes and by
   auth for default role on signup.
3. **rbacService facade** — keeps middlewares / blogs working until they inject
   use cases.

## Compatibility

- `src/services/auth/rbac.service.ts` re-exports `@/modules/rbac`.
- Auth's `RbacPort` adapter should point at this module (via the service or use
  cases).
- Role assignment HTTP lives in the users presentation layer
  (`PUT /:userId/role`).
