# Auth module

Vertical slice for authentication: signup, OTP, login, refresh, logout, and
password flows.

## Layout

```
auth/
├── domain/            # User entity, repository ports, JWT types, domain errors
├── application/       # Use-case commands + DTOs + TokenServicePort / Mailer / RBAC ports
├── infrastructure/    # Prisma repos, JWT + blacklist providers, Prisma↔domain mapper
├── presentation/      # Thin Express controllers, routes, validators, serializers
├── index.ts           # createAuthModule / createAuthRouter
└── README.md
```

## Dependency rules

| Layer          | May depend on                  | Must not import        |
| -------------- | ------------------------------ | ---------------------- |
| Domain         | shared domain (`AppError`)     | Express, Prisma, Redis |
| Application    | Domain ports + DTOs            | Express, Prisma        |
| Infrastructure | Domain ports (implements them) | Presentation           |
| Presentation   | Application use cases          | Prisma directly        |

## Public API

```ts
import { createAuthRouter, createAuthModule, createDefaultAuthDeps } from '@/modules/auth';

// Route registration
app.use(`${prefix}/auth`, createAuthRouter());

// Custom DI (tests / alternate providers)
const auth = createAuthModule(
  createDefaultAuthDeps({
    mailer: fakeMailer,
  }),
);
```

## Extension points

1. **TokenServicePort** — swap JWT keys / algorithm / session store without
   touching use cases.
2. **UserRepositoryPort / TokenRepositoryPort** — replace Prisma with another
   store.
3. **MailerPort / RbacPort** — point at the future mail / rbac modules.
4. **AvatarUploaderPort** — change storage backend for signup avatars.
5. **UserCachePort** — optional; omit in tests to skip cache invalidation.

## Container registration (notes)

When `src/app/container` exists:

```ts
const authModule = createAuthModule(createDefaultAuthDeps());
container.register('auth', authModule);
// mount: app.use('/api/auth', authModule.router)
```

## Compatibility

- Public surface is `src/modules/auth/index.ts`.
- Presentation here is the source of truth for HTTP.

## Session and security notes

- `isActive` is account status, not a login switch. Logout blacklists `jti` + refresh family.
- OTP is stored hashed (`hashOtpCode`); reset tokens are opaque Redis values, not JWTs.
- Login uses a dummy bcrypt hash when the email is unknown (timing).
- Credential routes sit behind `rateLimitingAuth` (`MAX_AUTH_QUERY_NUMBER`).
