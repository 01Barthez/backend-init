# Application Layer (`src/app`)

Composition root of the HTTP process — not business logic.

| Folder        | Responsibility                                       |
| ------------- | ---------------------------------------------------- |
| `config/`     | Typed env & settings (never `process.env` elsewhere) |
| `container/`  | Dependency wiring for all modules                    |
| `middleware/` | Cross-cutting Express middleware                     |
| `routes/`     | Mounts module routers under `/api/v1`                |
| `app.ts`      | Express factory + bootstrap hooks                    |

Domain rules live in `src/modules/*/domain`. Infrastructure adapters live in
`src/shared/infrastructure` and `src/modules/*/infrastructure`.
