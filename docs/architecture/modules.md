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

**Purpose.** Signup, OTP verification, optional TOTP, login, `/me`, sessions,
refresh-token rotation, logout, forgot/reset/change password.

**Public entry points.**

```ts
import {
  createAuthModule,
  createDefaultAuthDeps,
  createAuthRouter,
} from '@/modules/auth';
```

Mounted at: `{API_PREFIX}/auth`.

| Method | Path                   | Notes                                    |
| ------ | ---------------------- | ---------------------------------------- |
| POST   | `/signup`              | Multipart avatar; idempotency optional   |
| POST   | `/verify`              | Email OTP                                |
| POST   | `/resend-otp`          |                                          |
| POST   | `/login`               | `totpCode` required when TOTP is enabled |
| POST   | `/refresh`             | Cookie or JSON body                      |
| POST   | `/forgot-password`     |                                          |
| POST   | `/reset-password`      | Opaque Redis token                       |
| POST   | `/logout`              | Auth                                     |
| POST   | `/change-password`     | Auth; revokes all sessions               |
| GET    | `/me`                  | Auth                                     |
| GET    | `/sessions`            | Auth                                     |
| DELETE | `/sessions/:familyId`  | Auth                                     |
| POST   | `/totp/enroll`         | Auth; otpauth URL + secret once          |
| POST   | `/totp/confirm`        | Auth                                     |
| POST   | `/totp/disable`        | Auth; password + current code            |
| POST   | `/totp/recovery-codes` | Auth; generates one-time recovery codes  |
| POST   | `/totp/recover`        | Login path with recovery code            |

**Key use cases.** `SignupCommand`, `VerifyOtpCommand`, `ResendOtpCommand`,
`LoginCommand`, `GetCurrentUserQuery`, session list/revoke, TOTP
enroll/confirm/disable, `RefreshTokenCommand`, `LogoutCommand`,
`ForgotPasswordCommand`, `ResetPasswordCommand`, `ChangePasswordCommand`.

**How to extend.**

- Swap `TokenServicePort` (JWT algorithm / key source).
- Replace `UserRepositoryPort` / `TokenRepositoryPort` (Prisma → another store).
- Override `MailerPort`, `RbacPort`, `AvatarUploaderPort`, `UserCachePort` via
  `createDefaultAuthDeps({ ... })`.
- TOTP secrets use `AUTH_ENCRYPTION_KEY` (AES-256-GCM).

See [Authentication guide](../guides/authentication.md).

---

## users

**Purpose.** Self-service profile + admin user management: list/search/export,
invite, activate/deactivate, verify, unlock, force-logout, soft/hard delete,
restore, role assignment.

**Public entry points.**

```ts
import {
  createUsersModule,
  createDefaultUsersDeps,
  createUsersRouter,
} from '@/modules/users';
```

Mounted at: `{API_PREFIX}/users`.

**Boundary.** Own snapshot with roles = `GET /auth/me` (auth module). Password,
OTP, TOTP, and session families stay in auth; users calls a `SessionPort` for
revoke-all / invite reset tokens.

**Caps.** List `limit` max 100. Search `limit` max 50 (paginated). Sync export
max **2000** rows (`X-Export-Truncated` when capped; async MinIO export is a
follow-up). Assignable roles: `admin`, `user`, `guest`.

Full HTTP table: [users module README](../../src/modules/users/README.md).

**GDPR hard-delete** (`DELETE /:userId/permanent`): anonymize PII, tombstone
blogs, drop the user row only when no blogs remain.

**How to extend.**

- Implement `UsersRepositoryPort` for an alternate persistence layer.
- Reuse the auth `User` entity — do not duplicate user identity models.
- Role changes go through `RbacPort`; session revoke through `SessionPort`.

See `src/modules/users/README.md`.

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

No dedicated public REST router. HTTP role assignment lives on the users module
(`PUT /:userId/role`). Bootstrap seeding runs in `bootstrapApplication()` via
`rbacService.seedSystemRolesAndPermissions()`.

Seeded slugs: `super-admin`, `admin`, `user`, `guest`. Catalogue includes
`audit:read` (admin + super-admin). `SYSTEM_PERMISSIONS` lives in
`src/shared/constants/app.constants.ts`.

**How to extend.**

- Swap `RbacRepositoryPort`.
- Add permissions in Prisma RBAC models and seed logic; keep middlewares
  consuming the rbac facade or injected use cases.

---

## oauth

**Purpose.** Social login and account linking for Google, GitHub, Facebook,
LinkedIn, Twitter, Instagram, plus Telegram widget auth.

Gated by Flagsmith `enable_oauth` (default **true**). When off, authorize,
callback, Telegram, and unlink fail closed (`OAuthFeatureDisabledError`).

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
soft-delete, public listing and search. Replace this module with your business
domain when forking.

**Public entry points.**

```ts
import {
  createBlogModule,
  createDefaultBlogDeps,
  createBlogRouter,
} from '@/modules/blog';
```

Mounted at: `{API_PREFIX}/blogs`.

| Method | Path           | Auth              |
| ------ | -------------- | ----------------- |
| GET    | `/search`      | Public            |
| GET    | `/`            | Public            |
| GET    | `/:slug`       | Public            |
| POST   | `/`            | `blog:create`     |
| PUT    | `/:id`         | `blog:update:own` |
| PATCH  | `/:id/publish` | `blog:publish`    |
| DELETE | `/:id`         | `blog:delete:own` |

**How to extend.** Prefer copying the blog module as a structural template for a
new domain (see [Extending](./extending.md)), then delete or empty blog once
your domain is wired.

---

## files

**Purpose.** Validated user uploads (avatars, documents) with ClamAV scanning
(fail-open unless `CLAMAV_REQUIRED=true`) and presigned large-object I/O.
Distinct from shared object storage used for backups and raw put/get.

**Public entry points.**

```ts
import {
  createFilesModule,
  createDefaultFilesDeps,
  createFilesRouter,
  uploadAvatar,
  uploadFile,
  upload, // multer middleware
} from '@/modules/files';
```

Mounted at: `{API_PREFIX}/files`.

| Method | Path       | Notes                                              |
| ------ | ---------- | -------------------------------------------------- |
| POST   | `/presign` | Authenticated PUT URL (`PRESIGN_UPLOAD_MAX_BYTES`) |
| GET    | `/presign` | Authenticated GET URL (`key` query)                |

Avatars remain **multipart** on auth signup and users profile
(`upload.single('profile')`), capped at `API_UPLOAD_MAX_BYTES` (2MB). Magic-byte
sniff (`file-type`); `avatar` profile allows jpeg/png; default allows
jpeg/png/pdf.

ClamAV is injected on the singleton uploader in `infrastructure/config/minio.ts`
(skipped in tests).

**How to extend.**

- Implement `UploaderPort` / `ScannerPort`.
- For backups and bucket bootstrap, use `@/shared/infrastructure/storage` and
  `STORAGE_PROVIDER` (see [Storage providers](../guides/storage-providers.md)).

---

## backup

**Purpose.** MongoDB dump → streaming AES-256-GCM encryption (random salt) →
object storage upload, with admin notification mail. Invoked by the BullMQ
`BACKUP` worker.

Registered when `PROCESS_ROLE` is `all` or `worker` and Flagsmith
`enable_backup` is on (default true). `BACKUP_ENCRYPTION_KEY` is required for a
useful dump.

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
See [Backups](../guides/backup.md).

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

**Purpose.** Operational HTTP surfaces: health (live/ready), CSRF token, CSP
report, Prometheus metrics, Bull Board, audit investigation (list / detail /
export).

**Public entry points.**

```ts
import { createSystemRouters } from '@/modules/system';

const system = createSystemRouters();
// system.health | .csrf | .csp | .metrics | .audit | .setupBullBoard(app)
```

| Mount                                | Auth                          |
| ------------------------------------ | ----------------------------- |
| `/health`, `/live`, `/ready`         | none                          |
| `/metrics`                           | HTTP Basic (except tests)     |
| `/csrf-token`                        | none                          |
| CSP report URI                       | none                          |
| `/admin/queues`                      | Basic + JWT + `isAdmin`       |
| `{API_PREFIX}/admin/audit`           | JWT + `audit:read` — list     |
| `{API_PREFIX}/admin/audit/export`    | JWT + `audit:read` — CSV/JSON |
| `{API_PREFIX}/admin/audit/{auditId}` | JWT + `audit:read` — detail   |

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
