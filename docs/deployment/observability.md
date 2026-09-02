# Observability

Backend Init ships logging, metrics, and queue visibility suitable for a
production-minded starter. Monitoring Compose assets live under
`infra/monitoring/` and `infra/docker/docker-compose.monitoring.yml`.

## Logs

- **Library:** Winston, with daily rotate file support and optional Loki
  transport.
- **Config:** `config.observability` (`LOG_LEVEL`, `LOG_TO_FILE`,
  `LOKI_ENABLED`, …).
- **Code:** `@/shared/infrastructure/logging`.

Guidelines:

- Log structured context (request id, user id when safe) — never passwords,
  tokens, OTPs, or raw authorization headers.
- Prefer the shared logger over `console.*` in application code.
- Security-sensitive events may use the security logger helper where present.

### Loki

When `LOKI_ENABLED` is true and Loki is reachable, logs can be shipped to the
Loki stack defined under `infra/monitoring/loki`. Grafana datasources are
prepared under `infra/monitoring/grafana/`.

Start monitoring via project scripts (e.g.
`./infra/scripts/start_monitoring.sh`) or the monitoring Compose file.

## Metrics

- **Library:** `prom-client`
- **HTTP:** `GET /metrics` (system module / shared metrics router)
- **Prometheus:** scrape configs under `infra/monitoring/prometheus`

Use metrics for RED-style HTTP signals and process health. Keep the scrape
endpoint internal.

## Alerting

Sample Alertmanager config lives under `infra/monitoring/alertmanager`. Treat
shipped rules as a starting point — tune thresholds to your SLOs.

## Bull Board

BullMQ queues (mail, backup, maintenance, heavy tasks) can be inspected via
**Bull Board**, mounted by `setupBullBoard` from the system module during app
bootstrap.

Protect this UI in production (authn/authz at proxy or application layer). It is
an operator tool, not a public API.

## Queues and workers

Workers are started from shared queue infrastructure
(`src/shared/infrastructure/queue/workers.ts`). Failures should appear in logs;
repeatable jobs are re-registered idempotently on boot. See
[Background jobs](../guides/background-jobs.md).

## Related

- [Production](./production.md)
- [Docker](./docker.md)
- System module README: `src/modules/system/README.md`
