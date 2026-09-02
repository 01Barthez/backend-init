# Users module

Vertical slice for user administration: profile update, list/search/export,
soft/hard delete, restore, role assign, and dev clear-all.

## Layout

```
users/
├── domain/            # UsersRepositoryPort + public profile / filter types
├── application/       # Commands + queries + Mailer / Avatar / Cache / Rbac ports
├── infrastructure/    # Prisma repo, cache adapter, avatar uploader
├── presentation/      # Thin Express controllers, routes, validators, serializers
├── index.ts           # createUsersModule / createUsersRouter
└── README.md
```

## Dependency rules

| Layer          | May depend on                                               | Must not import |
| -------------- | ----------------------------------------------------------- | --------------- |
| Domain         | shared domain (`AppError`); auth `UserEntity` (re-exported) | Express, Prisma |
| Application    | Domain ports + sibling module ports (rbac)                  | Express, Prisma |
| Infrastructure | Domain ports (implements them)                              | Presentation    |
| Presentation   | Application use cases                                       | Prisma directly |

## Public API

```ts
import { createUsersRouter, createUsersModule, createDefaultUsersDeps } from '@/modules/users';

// Route registration
app.use(`${prefix}/users`, createUsersRouter());

// Custom DI (tests / alternate providers)
const users = createUsersModule(
  createDefaultUsersDeps({
    mailer: fakeMailer,
  }),
);
```

## Extension points

1. **UsersRepositoryPort** — replace Prisma with another store.
2. **UserCachePort** — swap cache backend or disable in tests.
3. **AvatarUploaderPort** — change storage backend for profile avatars.
4. **RbacPort** — points at `@/modules/rbac` for role assignment.
5. **User entity** — import from `@/modules/auth/domain/entities/user.entity`;
   do not duplicate.

## Container registration (notes)

When `src/app/container` exists:

```ts
const usersModule = createUsersModule(createDefaultUsersDeps());
container.register('users', usersModule);
// mount: app.use('/api/users', usersModule.router)
```

## Compatibility

- `src/routes/users/users.router.ts` re-exports `createUsersRouter()`.
- Legacy controller files under `src/controllers/users/users/` are deprecated
  re-exports of `usersHandlers`.
- Auth module avatar/cache adapters should prefer this module's providers.
