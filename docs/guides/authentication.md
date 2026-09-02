# Authentication

Email/password with OTP, RS256 JWTs, refresh rotation, and session revoke.
OAuth: [Adding an OAuth provider](./adding-oauth-provider.md).

## Session model

| Flag / store | Meaning |
| --- | --- |
| `user.isActive` | Account enabled (admin disable / soft-delete). **Not** “currently logged in”. Login does not flip this flag. |
| Refresh family + access `jti` blacklist | Actual sessions. Logout / password change / reuse detection revoke these. |
| Access JWT | Short-lived (default 15m). Blacklisted on logout. `authenticate` reloads live `isActive` / `isVerified` from the database. |

## Flows

1. `POST /auth/signup` — bcrypt (12) password, hashed OTP at rest, email OTP.
2. `POST /auth/verify` — hashed OTP compare, attempt cap (`MAX_OTP_ATTEMPTS`).
3. `POST /auth/login` — dummy bcrypt on unknown email, lockout (`MAX_LOGIN_ATTEMPTS` / `LOGIN_LOCKOUT_MS`), reject inactive accounts, JWT minted from current account flags.
4. `POST /auth/refresh` — rotate + reuse detection (family revoke). Refresh fails if the account is inactive.
5. `POST /auth/logout` — blacklist access `jti` + refresh family. Account stays active so the next login works.
6. `POST /auth/forgot-password` — identical response whether the email exists; opaque single-use token (Redis hash, not a JWT in the URL).
7. `POST /auth/reset-password` — body `resetToken` + `new_password`; consumes the token and revokes all sessions.
8. `POST /auth/change-password` — same session revoke.

## Tokens

- Access / refresh: RS256, algorithm pinned, `type` claim required (`ACCESS` / `REFRESH`), PEM keys **cached in process**.
- Refresh: SHA-256 at rest, rotation, family reuse revoke.
- Reset: `randomHex` + SHA-256 in Redis (`PASSWORD_RESET_EXPIRES_IN`).

## Cookies

`COOKIE_EXPIRES_IN` is a duration (`7d`, `15m`, or milliseconds). Empty `COOKIE_DOMAIN` = host-only. Flags: `Secure`, `HttpOnly`, `SameSite`. Align cookie TTL with `JWT_REFRESH_EXPIRES_IN`.

A bare integer is milliseconds (Express `maxAge`). Do not set `COOKIE_EXPIRES_IN=2` expecting “2 hours”.

## OAuth

- `redirectUrl` must match `CLIENT_URL` or `OAUTH_ALLOWED_ORIGINS`.
- Callback sets the refresh cookie and redirects **without** tokens in the query string.
- Inactive accounts cannot complete OAuth login.
- Provider access/refresh tokens are AES-256-GCM (`AUTH_ENCRYPTION_KEY`). Empty key → tokens are not stored.

## Rate limits

Auth credential routes use `MAX_AUTH_QUERY_NUMBER` / `MAX_AUTH_QUERY_WINDOW` (default 10 / 15 min) in addition to the global `/auth` bucket.

## CSRF

When `ALLOW_CSRF_PROTECTION=true`, `csurf` owns the httpOnly secret cookie. GET requests (including `/csrf-token` and OAuth callbacks) are ignored. `GET /csrf-token` returns the token in JSON only (does not overwrite that cookie).

## Related

- [Modules — auth](../architecture/modules.md)
- [OpenAPI](../api/README.md)
- `src/modules/auth/README.md`
