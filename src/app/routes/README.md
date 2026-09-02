# Application Routes

Central HTTP route registry for the Express application.

## Role

`registerRoutes` in `index.ts` mounts:

1. **System surfaces** — CSP report URI, CSRF token, health, metrics
   (unversioned).
2. **Versioned domain API** — auth, OAuth, users, blogs under
   `config.app.apiPrefix`.

Domain modules own their routers; this file only wires them. Adding a module is
one mount line here plus container registration in `src/app/container`.

## Conventions

- Prefer `container.<module>.router` over importing routers from presentation
  layers directly.
- Apply `rateLimitingSubRoute` on public HTTP entry points unless metrics/health
  need different treatment.
- Do not put business logic in this file — keep it a thin composition root for
  HTTP.
