# Users module

User administration and self-service profile surfaces.

**Auth boundary:** credentials, OTP, TOTP, sessions, and `GET /auth/me` stay in
the **auth** module. Users owns profile CRUD, lifecycle, invite, list/search/
export, and admin force-logout (via a session port into auth).

`ClearAllUsersCommand` is scripts-only — no HTTP `DELETE /users/clear-all`.

## HTTP (mounted at `{API_PREFIX}/users`)

### Self-service

| Method | Path              | Notes                                     |
| ------ | ----------------- | ----------------------------------------- |
| PUT    | `/profile`        | Own profile + optional avatar             |
| DELETE | `/profile/avatar` | Clear own avatar                          |
| DELETE | `/me`             | Soft-delete own account + revoke sessions |

### Admin

| Method | Path                       | Permission                                    |
| ------ | -------------------------- | --------------------------------------------- |
| POST   | `/invite`                  | `user:update:any`                             |
| GET    | `/`                        | `user:read:any` (limit ≤ 100)                 |
| GET    | `/search`                  | `user:read:any` (limit ≤ 50, paginated)       |
| GET    | `/export`                  | `user:export` (≤ 10k rows, optional filters)  |
| GET    | `/:userId`                 | `user:read:any` (includes roles)              |
| GET    | `/:userId/sessions`        | `user:read:any` (refresh families; audited)   |
| PATCH  | `/:userId`                 | `user:update:any`                             |
| PUT    | `/:userId/role`            | `user:role:assign` (`admin`\|`user`\|`guest`) |
| POST   | `/:userId/activate`        | `user:update:any`                             |
| POST   | `/:userId/deactivate`      | `user:update:any` (+ revoke sessions)         |
| POST   | `/:userId/verify-email`    | `user:update:any`                             |
| POST   | `/:userId/unlock`          | `user:update:any`                             |
| POST   | `/:userId/revoke-sessions` | `user:update:any`                             |
| DELETE | `/:userId/oauth/:provider` | `user:update:any` (force unlink; audited)     |
| DELETE | `/:userId`                 | `user:delete:any`                             |
| DELETE | `/:userId/permanent`       | `user:delete:any` (GDPR)                      |
| POST   | `/:userId/restore`         | `user:update:any` (reactivates if verified)   |

## Layout

```
users/
├── domain/
├── application/       # Commands + queries + ports (rbac, session, mail, cache, avatar)
├── infrastructure/
├── presentation/
├── index.ts
└── README.md
```

## Public API

```ts
import { createUsersRouter, createUsersModule, createDefaultUsersDeps } from '@/modules/users';

const users = createUsersModule(
  createDefaultUsersDeps({
    mailer: fakeMailer,
  }),
);
```

Mount via `container.users.router` in `src/app/routes`.
