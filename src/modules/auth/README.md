# Auth module

Vertical slice for authentication: signup, OTP, optional TOTP, login, `/me`,
sessions, refresh, logout, and password flows.

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

## HTTP (mounted at `{API_PREFIX}/auth`)

| Method | Path                  | Notes                                         |
| ------ | --------------------- | --------------------------------------------- |
| POST   | `/signup`             | Multipart `profile`; optional Idempotency-Key |
| POST   | `/verify`             | Email OTP                                     |
| POST   | `/resend-otp`         |                                               |
| POST   | `/login`              | `totpCode` when TOTP is enabled               |
| POST   | `/refresh`            | Cookie or body                                |
| POST   | `/forgot-password`    |                                               |
| POST   | `/reset-password`     | Opaque Redis token                            |
| POST   | `/logout`             | Auth                                          |
| POST   | `/change-password`    | Auth; revokes all sessions                    |
| GET    | `/me`                 | Auth                                          |
| GET    | `/sessions`           | Auth                                          |
| DELETE | `/sessions/:familyId` | Auth                                          |
| POST   | `/totp/enroll`        | Returns otpauth URL + secret once             |
| POST   | `/totp/confirm`       |                                               |
| POST   | `/totp/disable`       | Password + current TOTP code                  |

TOTP secrets are AES-256-GCM (`AUTH_ENCRYPTION_KEY`). Required in production.

## Public API

```ts
import { createAuthRouter, createAuthModule, createDefaultAuthDeps } from '@/modules/auth';

const auth = createAuthModule(
  createDefaultAuthDeps({
    mailer: fakeMailer,
  }),
);
```

Wiring is a typed object on `createContainer()` (`container.auth.router`), not a
string registry.

## Extension points

1. **TokenServicePort** — swap JWT keys / algorithm / session store without
   touching use cases.
2. **UserRepositoryPort / TokenRepositoryPort** — replace Prisma with another
   store.
3. **MailerPort / RbacPort** — point at the mail / rbac modules.
4. **AvatarUploaderPort** — change storage backend for signup avatars.
5. **UserCachePort** — optional; omit in tests to skip cache invalidation.

## Session and security notes

- `isActive` is account status, not a login switch. Logout blacklists `jti` +
  refresh family.
- OTP is stored hashed (`hashOtpCode`); reset tokens are opaque Redis values,
  not JWTs.
- Login uses a dummy bcrypt hash when the email is unknown (timing).
- Credential routes sit behind `rateLimitingAuth` (`MAX_AUTH_QUERY_NUMBER`).

See [Authentication](../../../docs/guides/authentication.md).
