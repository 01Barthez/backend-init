# Application Routes

Central HTTP route registry for the Express application.

## Role

`registerRoutes` in `index.ts` mounts:

1. **System surfaces** — CSP report URI, CSRF token, health (unversioned).
   Metrics are mounted **without** `rateLimitingSubRoute`.
2. **Versioned domain API** — auth, OAuth, users, blogs, files, admin audit
   under `config.app.apiPrefix`.

| Prefix         | Source                   |
| -------------- | ------------------------ |
| `/auth`        | `container.auth.router`  |
| `/auth/oauth`  | `container.oauth.router` |
| `/users`       | `container.users.router` |
| `/blogs`       | `container.blog.router`  |
| `/files`       | `container.files.router` |
| `/admin/audit` | `container.system.audit` |

Domain modules own their routers; this file only wires them. Adding a module is
one mount line here plus container registration in `src/app/container`.

## Conventions

- Prefer `container.<module>.router` over importing routers from presentation
  layers directly.
- Apply `rateLimitingSubRoute` on public HTTP entry points. Metrics stay ungated
  by that limiter (operator Basic auth is applied in the metrics router).
- Do not put business logic in this file — keep it a thin composition root for
  HTTP.
