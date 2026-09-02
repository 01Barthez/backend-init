# System module

Operational HTTP surfaces: health, CSRF token, CSP report endpoint, Prometheus
metrics, Bull Board.

## Layout

```
system/
├── presentation/
│   ├── controllers/   # health, csrf, csp
│   └── routes/        # health, csrf, csp, admin/queues
├── infrastructure/    # metrics re-export
├── index.ts           # createSystemRouters()
└── README.md
```

## Public API

```ts
import { createSystemRouters } from '@/modules/system';

const system = createSystemRouters();

app.use('/health', system.health);
app.use('/csrf-token', system.csrf);
app.use(envs.CSP_REPORT_URI, system.csp);
app.use('/metrics', system.metrics);
system.setupBullBoard(app);
```

## Compatibility

Legacy routers under `src/routes/_config/**` and controllers under
`src/controllers/_config/**` re-export from this module. Bull Board setup is
also re-exported from `src/routes/_config/admin/queues.router.ts`.
