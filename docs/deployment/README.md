# Deployment

Run and operate Backend Init in Docker and production environments.

## Documents

| Document                                    | Purpose                                      |
| ------------------------------------------- | -------------------------------------------- |
| [Docker](./docker.md)                       | Compose stacks, images, local infra services |
| [Production](./production.md)               | Hardening, secrets, rollback, scaling notes  |
| [GitHub → VPS](./github-vps.md)             | Secrets, GHCR, OVH/NPM, CD compose           |
| [Observability](./observability.md)         | Logs, metrics, Loki, and alerting hooks      |
| [Security scanning](./security-scanning.md) | npm audit, Trivy, OSV, gitleaks, SAST        |
| [JWT keys](./jwt-keys.md)                   | PEM layout + Docker UID permissions          |

Prefer the Docker guide for local parity with CI; use Production before exposing
the API publicly. Use [GitHub → VPS](./github-vps.md) for Environments and CD.
