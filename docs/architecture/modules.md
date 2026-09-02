# Modules Catalog

Each entry under `src/modules/` is a bounded context. Public entry points are
the module `index.ts` exports and (when present) the HTTP router mounted from
`src/app/routes/index.ts`.

## Shared module layout

```
module-name/
├── domain/
├── application/
├── infrastructure/
├── presentation/     # optional for non-HTTP modules
├── index.ts
└── README.md
```

---

## auth

**Purpose.** Signup, OTP verification, login, refresh-token rotation, logout,
forgot/reset/change password.

**Public entry points.**

```ts
import {
  createAuthModule,
  createDefaultAuthDeps,
  createAuthRouter,
} from '@/modules/auth';
```

Mounted at: `{API_PREFIX}/auth`.

**Key use cases.** `SignupCommand`, `VerifyOtpCommand`, `ResendOtpCommand`,
`LoginCommand`, `RefreshTokenCommand`, `LogoutCommand`, `ForgotPasswordCommand`,
`ResetPasswordCommand`, `ChangePasswordCommand`.

**How to extend.**

- Swap `TokenServicePort` (JWT algorithm / key source).
- Replace `UserRepositoryPort` / `TokenRepositoryPort` (Prisma → another store).
- Override `MailerPort`, `RbacPort`, `AvatarUploaderPort`, `UserCachePort` via
  `createDefaultAuthDeps({ ... })`.

See [Authentication guide](../guides/authentication.md).

---

## users

**Purpose.** Profile update, list/search/export, soft/hard delete, restore, role
assignment, and development clear-all utilities.

**Public entry points.**

```ts
import {
  createUsersModule,
  createDefaultUsersDeps,
  createUsersRouter,
} from '@/modules/users';
```

Mounted at: `{API_PREFIX}/users`.

**How to extend.**

- Implement `UsersRepositoryPort` for an alternate persistence layer.
- Reuse the auth `User` entity — do not duplicate user identity models.
- Role changes go through `RbacPort` (rbac module).

---

## rbac

**Purpose.** Roles, permissions, ACL resolution, system role seeding, and role
assignment used by auth (default role on signup) and users (admin role updates).

**Public entry points.**

```ts
import {
  createRbacModule,
  createDefaultRbacDeps,
  rbacService,
} from '@/modules/rbac';
```

No dedicated public REST router today. HTTP role assignment lives on the users
module (`PUT /:userId/role`). Bootstrap seeding is typically invoked at server
start via `rbacService.seedSystemRolesAndPermissions()`.

**How to extend.**

- Swap `RbacRepositoryPort`.
- Add permissions in Prisma RBAC models and seed logic; keep middlewares
  consuming the rbac facade or injected use cases.

---

## oauth

**Purpose.** Social login and account linking for Google, GitHub, Facebook,
LinkedIn, Twitter, Instagram, plus Telegram widget auth.

**Public entry points.**

```ts
import {
  createOAuthModule,
  createDefaultOAuthDeps,
  createOAuthRouter,
} from '@/modules/oauth';
```

Mounted at: `{API_PREFIX}/auth/oauth`.

| Method | Path                  | Notes                                |
| ------ | --------------------- | ------------------------------------ |
| GET    | `/accounts`           | Authenticated — list linked accounts |
| POST   | `/telegram`           | Public — Telegram widget             |
| GET    | `/:provider`          | Redirect to provider                 |
| GET    | `/:provider/callback` | OAuth callback                       |
| DELETE | `/:provider/unlink`   | Authenticated                        |

**How to extend.** See
[Adding an OAuth provider](../guides/adding-oauth-provider.md).

---

## blog

**Purpose.** Reference domain for the template: create, update, publish,
soft-delete, and public listing. Replace this module with your business domain
when forking.

**Public entry points.**

```ts
import {
  createBlogModule,
  createDefaultBlogDeps,
  createBlogRouter,
} from '@/modules/blog';
```

Mounted at: `{API_PREFIX}/blogs`.

**How to extend.** Prefer copying the blog module as a structural template for a
new domain (see [Extending](./extending.md)), then delete or empty blog once
your domain is wired.

---

## files

**Purpose.** Validated user uploads (avatars, documents, media) with optional
ClamAV scanning. Distinct from shared object storage used for backups and raw
put/get.

**Public entry points.**

```ts
import {
  createFilesModule,
  createDefaultFilesDeps,
  uploadAvatar,
  uploadFile,
  upload, // multer middleware
} from '@/modules/files';
```

No dedicated versioned HTTP routes — presentation exposes Multer middleware
consumed by auth/users routes.

**How to extend.**

- Implement `UploaderPort` / `ScannerPort`.
- For backups and bucket bootstrap, use `@/shared/infrastructure/storage` and
  `STORAGE_PROVIDER` (see [Storage providers](../guides/storage-providers.md)).

---

## backup

**Purpose.** MongoDB dump → AES-256-GCM encryption → object storage upload, with
admin notification mail. Invoked by the BullMQ `BACKUP` worker.

**Public entry points.**

```ts
import {
  runMongoBackup,
  createBackupModule,
  createDefaultBackupDeps,
} from '@/modules/backup';
```

Wired from `src/shared/infrastructure/queue/workers.ts`.

**How to extend.** Swap `MongoBackupProvider`; keep mail templates
`db-notification-success` / `db-notification-error` in shared mail templates.

---

## notifications

**Purpose.** Thin facade over shared mail infrastructure for transactional /
templated email. Templates live in `src/shared/infrastructure/mail/templates/` —
do not duplicate EJS files inside the module.

**Public entry points.**

```ts
import {
  sendTemplatedMail,
  queueMail,
  createNotificationsModule,
} from '@/modules/notifications';
```

**How to extend.** Change SMTP or queue adapters under
`@/shared/infrastructure/mail`. Add presentation later only if you need an admin
“send test email” endpoint.

---

## system

**Purpose.** Operational HTTP surfaces: health, CSRF token, CSP report endpoint,
Prometheus metrics, Bull Board.

**Public entry points.**

```ts
import { createSystemRouters } from '@/modules/system';

const system = createSystemRouters();
// system.health | .csrf | .csp | .metrics | .setupBullBoard(app)
```

Mounted outside or alongside the API prefix as registered in
`src/app/routes/index.ts` (health, metrics, csrf, CSP URI).

**How to extend.** Add ops routes under `presentation/routes` and expose them
from `createSystemRouters`.

---

## Wiring checklist (all modules)

1. Export `createXxxModule` + `createDefaultXxxDeps` from `index.ts`.
2. Register in `src/app/container/index.ts` when the module participates in the
   HTTP graph (or call use cases from workers for background-only modules).
3. Mount routers in `src/app/routes/index.ts` when HTTP is required.
4. Keep the module `README.md` and this catalog in sync.
5. Prefer overriding ports in tests via `createContainer({ ... })` /
   `createDefaultXxxDeps({ ... })`.
