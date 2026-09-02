# Cross-cutting Express middleware

Global HTTP concerns only. Domain-specific middleware (e.g.
`requirePermission('blog:create')`) belongs next to the module that owns that
permission — typically under `modules/<name>/presentation/`.

| File                             | Role                          |
| -------------------------------- | ----------------------------- |
| `init-middlewares.ts`            | Pipeline assembly             |
| `security-config.ts`             | CSP, rate limits, Morgan      |
| `authenticate.middleware.ts`     | JWT access-token verification |
| `error.middleware.ts`            | Maps `AppError` → HTTP        |
| `not-found.middleware.ts`        | 404 fallback                  |
| `validation-error.middleware.ts` | express-validator errors      |
| `pagination.middleware.ts`       | `page` / `limit` parsing      |
| `request-logger.middleware.ts`   | Structured request logs       |
| `response-time.middleware.ts`    | Timing header / metrics       |
