# System module

Operational HTTP surfaces: health (live/ready), CSRF token, CSP report,
Prometheus metrics, Bull Board, audit investigation (list / detail / export).

## Layout

```
system/
├── presentation/
│   ├── controllers/   # health, csrf, csp, audit
│   ├── routes/        # health, csrf, csp, admin/queues, audit
│   └── schemas/       # audit query validation
├── infrastructure/    # metrics re-export
├── index.ts           # createSystemRouters()
└── README.md
```

## Surfaces

| Mount                      | Auth                               |
| -------------------------- | ---------------------------------- |
| `/health`                  | none — Mongo + Redis (503 if down) |
| `/health/live`             | none — process only                |
| `/health/ready`            | none — same as `/health`           |
| `/metrics`                 | HTTP Basic except `NODE_ENV=test`  |
| `/csrf-token`              | none                               |
| CSP report URI (POST/GET)  | none                               |
| `/admin/queues`            | Basic + JWT + `isAdmin`            |
| `{API_PREFIX}/admin/audit`          | JWT + `audit:read` — list     |
| `{API_PREFIX}/admin/audit/export`   | JWT + `audit:read` — CSV/JSON |
| `{API_PREFIX}/admin/audit/{auditId}` | JWT + `audit:read` — detail  |

Audit HTTP is **read-only** (append-only trail). Filters on list/export:
`actorId`, `action`, `resource`, `requestId`, `from`, `to`. Export accepts
`format=csv|json` (default csv, max 10_000 rows).

Public Nginx exposes only `/health` and `/api/`. Scrape `/metrics` on the
private network.

## Public API

```ts
import { createSystemRouters } from '@/modules/system';

const system = createSystemRouters();

app.use('/health', system.health);
app.use('/csrf-token', system.csrf);
app.use(config.security.cspReportUri, system.csp);
app.use('/metrics', system.metrics);
app.use(`${prefix}/admin/audit`, system.audit);
system.setupBullBoard(app);
```
