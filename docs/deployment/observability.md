# Observability

Backend Init ships logging, metrics, and queue visibility suitable for a
production-minded starter. Monitoring Compose assets live under
`infra/monitoring/` and `infra/docker/docker-compose.monitoring.yml`.

## Logs

- **Library:** Winston, with daily rotate file support and optional Loki
  transport.
- **Code:** `@/shared/infrastructure/logging`.

Winston currently:

- Uses log level `warn` in production and `debug` otherwise (`NODE_ENV`), not
  `LOG_LEVEL`.
- Adds rotating file transports when `logs/` is writable, not when `LOG_TO_FILE`
  is true. Those two env vars are parsed into `config.observability` for a
  future logger pass — do not document them as live controls.

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
