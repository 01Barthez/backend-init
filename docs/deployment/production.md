# Production

Checklist for running Backend Init beyond local Compose. Adjust to your cloud
and compliance needs.

## Secrets

- Inject secrets at runtime (platform secrets, Vault, Infisical, Kubernetes
  secrets). Config already exposes Infisical-related env placeholders under
  `config.features.infisical`.
- Never bake `.env` with production credentials into images.
- Rotate OAuth client secrets, SMTP credentials, MinIO/S3 keys, and
  `BACKUP_ENCRYPTION_KEY` on a schedule.
- Keep `SWAGGER_PASSWORD` strong or disable Swagger (`SWAGGER_ENABLED=false`) in
  public environments.

## JWT keys

RS256 expects private/public key material on disk paths configured via:

- `JWT_PRIVATE_KEY_PATH` / `JWT_PUBLIC_KEY_PATH`
- `JWT_REFRESH_PRIVATE_KEY_PATH` / `JWT_REFRESH_PUBLIC_KEY_PATH`

Production pattern:

1. Generate keys outside the image build.
2. Mount them read-only into the container (e.g. `/run/secrets/…`).
3. Point env paths at the mount.
4. Restrict filesystem permissions; do not commit private keys.

HS256 `JWT_SECRET` is **not** used. Do not add a symmetric secret as a fallback.

## Auth encryption and cookies

- Set `AUTH_ENCRYPTION_KEY` (64-char hex or a strong passphrase) so OAuth provider tokens are stored AES-256-GCM. Empty = tokens are not persisted.
- `COOKIE_EXPIRES_IN` must be a duration (`7d`) or milliseconds. Align with `JWT_REFRESH_EXPIRES_IN`.
- Leave `COOKIE_DOMAIN` empty for host-only cookies unless you explicitly need a parent domain.
- Restrict OAuth post-login redirects with `OAUTH_ALLOWED_ORIGINS` (comma-separated). `CLIENT_URL` is always allowed.
- Enable CSRF for browser cookie flows (`ALLOW_CSRF_PROTECTION=true`).

## Reverse proxy

Compose includes `nginx` with `infra/nginx/default.conf`. In production:

- Terminate TLS at the proxy or mesh
- Forward `X-Forwarded-*` correctly so cookies and secure flags behave
- Rate-limit at the edge in addition to Express rate limits
- Block public access to Bull Board and, if appropriate, `/metrics`

## Health and metrics

| Endpoint        | Use                             |
| --------------- | ------------------------------- |
| `GET /health`   | Liveness/readiness probes       |
| `GET /metrics`  | Prometheus scrape target        |
| `GET /api-docs` | OpenAPI UI (protect or disable) |

Wire probes to `/health`. Scrape `/metrics` from an internal network only.

## Process model

- Run `npm run build` then `npm start` (compiled `dist/` with module-alias).
- Ensure BullMQ workers start with the process (template boots workers alongside
  the HTTP server).
- Set `NODE_ENV=production`.
- Pin Node 20+ as in `package.json` `engines`.

## Data and backups

- Prefer managed MongoDB or a replica set with automated backups.
- Application-level encrypted dumps use the backup module + `BACKUP_CRON`;
  verify restore procedures.
- Redis should be durable enough for your queue tolerance (AOF is enabled in the
  sample Compose Redis).

## Security headers and cookies

- Confirm `COOKIE_SECURE`, `COOKIE_SAME_SITE`, and domain settings for your
  public URL. `COOKIE_EXPIRES_IN` is Express `maxAge` (use `7d`, not `2`).
- Enable CSRF protection when browser cookie flows require it
  (`ALLOW_CSRF_PROTECTION`). `GET /csrf-token` returns JSON only.
- Keep Helmet / CSP report URI configured; monitor CSP reports.

## Related

- [Docker](./docker.md)
- [Observability](./observability.md)
- [Configuration](../architecture/configuration.md)
- [SECURITY.md](../../SECURITY.md)
