# Application Layer (`src/app`)

Composition root of the HTTP process — not business logic.

| Folder / file  | Responsibility                                   |
| -------------- | ------------------------------------------------ |
| `config/`      | Typed env (never `process.env` elsewhere)        |
| `container/`   | Dependency wiring for all modules                |
| `middleware/`  | Cross-cutting Express middleware                 |
| `routes/`      | Mounts module routers under `/api/v1`            |
| `app.ts`       | `createApp()` factory + `bootstrapApplication()` |
| `../index.ts`  | Process entry: bootstrap, listen, shutdown       |
| `../server.ts` | Express export for tests (no listen)             |

`createApp()` must stay side-effect free so Vitest can import it.
`bootstrapApplication()` seeds RBAC, ensures buckets, verifies SMTP, and starts
workers unless `PROCESS_ROLE=api`. HTTP listen lives in `src/index.ts` and is
skipped when `PROCESS_ROLE=worker`.

Domain rules live in `src/modules/*/domain`. Infrastructure adapters live in
`src/shared/infrastructure` and `src/modules/*/infrastructure`.
