# Observability

Backend Init ships logging, metrics, and queue visibility suitable for a
production-minded starter. Monitoring Compose assets live under
`infra/monitoring/` and `infra/docker/docker-compose.monitoring.yml`.

## Logs

- **Library:** Winston (+ optional Loki transport)
- **Code:** `@/shared/infrastructure/logging`
- **Ops path for this template:** **stdout** (Docker/K8s scrape) and optional
  **Loki** when `LOKI_ENABLED=true`. There is no MinIO log-archive pipeline.

| Env            | Effect                                                                 |
| -------------- | ---------------------------------------------------------------------- |
| `LOG_LEVEL`    | Winston level for console (and file transports when enabled)           |
| `LOG_TO_FILE`  | When `true`, also write rotating files under `logs/` (local debug)     |
| `LOKI_ENABLED` | Ship logs to `LOKI_HOST`                                               |

Do not mount a host volume for `logs/` in Compose for “production-like” runs —
prefer stdout/Loki. Enable `LOG_TO_FILE` only when you need local file dumps.

Guidelines:

- Log structured context (request id, user id when safe) — never passwords,
  tokens, OTPs, or raw authorization headers.
- Prefer the shared logger over `console.*` in application code.
- Security-sensitive events may use the security logger helper where present.

### Loki

When `LOKI_ENABLED` is true, logs ship to `LOKI_HOST` (default
`http://loki:3100`). Grafana datasources are prepared under
`infra/monitoring/grafana/`.

Start monitoring via project scripts (e.g.
`./infra/scripts/start_monitoring.sh`) or the monitoring Compose file.

### Tracing

`OTEL_ENABLED` is a **reserved** flag. The template parses W3C `traceparent`
into request context (ALS) but does **not** initialize the OpenTelemetry Node
SDK at boot.

## Metrics

- **Library:** `prom-client`
- **HTTP:** `GET /metrics`
- **Auth:** HTTP Basic (`ADMIN_BASIC_*`, fallback `SWAGGER_*`) except
  `NODE_ENV=test`
- **Network:** not published by Nginx; scrape `backend:3000` on
  `backend_network`
- **Prometheus:** scrape configs under `infra/monitoring/prometheus`

Use metrics for RED-style HTTP signals and process health.

## Alerting

Sample Alertmanager config lives under `infra/monitoring/alertmanager`. Treat
shipped rules as a starting point — tune thresholds to your SLOs.

## Bull Board

BullMQ queues (mail, backup, maintenance, heavy tasks) can be inspected via
**Bull Board** at `/admin/queues`.

Access: HTTP Basic **then** JWT **then** `isAdmin` (`admin` or `super-admin`).
It is an operator tool, not a public API, and is 404 through public Nginx.

## Queues and workers

Workers start from shared queue infrastructure
(`src/shared/infrastructure/queue/workers.ts`) when `PROCESS_ROLE` is not `api`.
Failures should appear in logs; repeatable jobs are re-registered idempotently
on boot. See [Background jobs](../guides/background-jobs.md).

## Related

- [Production](./production.md)
- [Docker](./docker.md)
- System module README: `src/modules/system/README.md`
