# Cross-cutting Express middleware

Global HTTP concerns only. Domain-specific middleware (e.g.
`requirePermission('blog:create')`) belongs next to the module that owns that
permission — typically under `modules/<name>/presentation/`.

| File                             | Role                                                 |
| -------------------------------- | ---------------------------------------------------- |
| `init-middlewares.ts`            | Pipeline assembly                                    |
| `request-context.middleware.ts`  | ALS + `X-Request-Id` correlation                     |
| `http-log.middleware.ts`         | Access log, RED metrics, security signals            |
| `maintenance.middleware.ts`      | 503 when `MAINTENANCE_MODE=true`                     |
| `admin-basic-auth.middleware.ts` | HTTP Basic for Swagger / Bull Board / metrics        |
| `idempotency.middleware.ts`      | Opt-in `Idempotency-Key` replay (Redis, actor-bound) |
| `security-config.ts`             | CSP, rate limits                                     |
| `authenticate.middleware.ts`     | JWT access-token verification                        |
| `auth.middleware.ts`             | `isAdmin` (`admin` or `super-admin`) for Bull Board  |
| `error.middleware.ts`            | Maps `AppError` → JSON (+ `requestId`)               |
| `not-found.middleware.ts`        | 404 fallback                                         |
| `validation-error.middleware.ts` | express-validator errors                             |
| `pagination.middleware.ts`       | Per-route `page` / `limit` parsing                   |

## Pipeline order

1. Helmet + HSTS + CSP
2. Request context (ALS)
3. Maintenance gate
4. Cookie parser + CORS
5. Body parsers (size-limited)
6. HTTP log + metrics
7. Compression + rate limits
8. CSRF (when enabled)
9. Validation error handler
10. Module routes
11. Error + not-found handlers

Bull Board (`/admin/queues`) is mounted in `setupBullBoard`: HTTP Basic, then
JWT `authenticate`, then `isAdmin`.

See [Platform kernel](../../../docs/architecture/platform-kernel.md) for audit,
locks, search, and outbound HTTP defaults.
