# Authentication

Backend Init implements email/password auth with OTP verification, RS256 JWTs,
and refresh-token rotation. OAuth is covered separately in
[Adding an OAuth provider](./adding-oauth-provider.md).

## Building blocks

| Concern         | Location                                |
| --------------- | --------------------------------------- |
| HTTP routes     | `src/modules/auth/presentation`         |
| Use cases       | `src/modules/auth/application/commands` |
| JWT + blacklist | auth infrastructure providers           |
| Config          | `config.auth` / JWT key paths           |
| Mount           | `{API_PREFIX}/auth`                     |

## Signup and OTP

1. `POST /auth/signup` — creates an unverified user (optional profile upload via
   Multer/files module), sends OTP email.
2. `POST /auth/verify` — validates OTP, marks the account verified.
3. `POST /auth/resend-otp` — issues a new OTP subject to delay (`OTP_DELAY` /
   `config.auth.otpDelayMs`).

OTP generation helpers live under `@/shared/utils/otp`. Mail is sent through
mailer ports → shared mail / notifications infrastructure (queued when workers
are running).

## Login and tokens

1. `POST /auth/login` — validates credentials; issues an **access token**
   (Bearer) and a **refresh token** (HTTP-only cookie by default, name from
   `REFRESH_TOKEN_COOKIE`).
2. Access tokens are JWT RS256 using configured key paths and expiries
   (`JWT_ACCESS_EXPIRES_IN`, etc.).
3. RBAC context is attached via the auth module’s RBAC port (roles/permissions
   from the rbac module).

## Refresh rotation

`POST /auth/refresh` rotates refresh tokens: the previous refresh credential is
invalidated (blacklist / token store) and a new pair is issued. Clients must
treat refresh as single-use.

This limits replay if a refresh cookie is stolen and used once by an attacker
(the legitimate client fails on next refresh and can be forced to
re-authenticate).

## Logout and password flows

| Endpoint                                 | Behavior                        |
| ---------------------------------------- | ------------------------------- |
| `POST /auth/logout`                      | Authenticated; revokes tokens   |
| `POST /auth/forgot-password`             | Sends reset mail                |
| `POST /auth/reset-password/:resetToken?` | Consumes reset token            |
| `POST /auth/change-password`             | Authenticated; updates password |

## Middleware

Protected routes typically chain:

- `authenticate` — Bearer access token
- `requireVerified` / `requireActive` — account state
- RBAC checks where applicable

Prefer these middlewares over ad-hoc JWT parsing in controllers.

## Operational notes

- Mount JWT keys securely in production
  ([production.md](../deployment/production.md)).
- Tune cookie flags (`Secure`, `HttpOnly`, `SameSite`, domain) for your frontend
  origin (`CLIENT_URL`).
- Rate limits apply on auth routes via the shared rate-limiting sub-route
  wrapper.

## Related

- [Modules — auth](../architecture/modules.md)
- [OpenAPI](../api/README.md)
- Auth module README: `src/modules/auth/README.md`
