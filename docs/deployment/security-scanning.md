# Security scanning

Local and CI controls for SCA (dependencies), SAST (static analysis), and
secrets.

## Tools (three SCA channels)

| Tool            | Role                     | Local                                                                 | CI                               |
| --------------- | ------------------------ | --------------------------------------------------------------------- | -------------------------------- |
| **npm audit**   | Node advisory DB         | `npm run security:audit`                                              | `.github/workflows/security.yml` |
| **Trivy**       | FS + lockfile + IaC      | `npm run security:trivy` (needs vulndb; prefer CI if download stalls) | `trivy-fs` + `trivy-config` jobs |
| **OSV Scanner** | Google OSV lockfile scan | `osv-scanner -L package-lock.json` (or OSV QueryBatch API)            | same workflow                    |

SAST:

| Tool                                       | Role                                                      |
| ------------------------------------------ | --------------------------------------------------------- |
| ESLint (`eslint-plugin-security`, SonarJS) | Pattern-based code issues (`npm run lint:ci`)             |
| CodeQL                                     | GitHub advanced analysis (`.github/workflows/codeql.yml`) |

Secrets:

| Tool     | Role                                              |
| -------- | ------------------------------------------------- |
| Gitleaks | History + working tree secrets (`.gitleaks.toml`) |

```bash
npm run security:audit
npm run security:secrets
# Optional when Docker + Trivy DB are reachable:
npm run security:trivy
```

## Acceptable residual risk

Production CI fails on **high/critical** for npm audit and Trivy
(`ignore-unfixed: true`). Prefer fixing via `overrides` or direct bumps; do
**not** run `npm audit fix --force` blindly — it may downgrade Prisma / MinIO or
jump Express to v5.

Known **moderate** residual (tracked, not forced):

| Package                     | Why kept                                                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| `stream-json` (via `minio`) | Fixed in 3.x but MinIO still imports the 1.x path layout; forcing 3.x breaks MinIO ESM imports |

`file-type` is pinned to **≥22** (ESM, dynamic import + ambient shim under
`src/types/shims/`) to clear GHSA-5v7r-6r5c-r473.

## Overrides

`package.json` → `overrides` pins patched transitive versions (`protobufjs`,
`qs`, `validator`, `cookie`, `decode-uri-component`, `minimatch`, …) without
waiting for every upstream release.

## After dependency bumps

```bash
npm run security:audit
npm run type-check
npm run test:unit
npm run security:secrets
```
