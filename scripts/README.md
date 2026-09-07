# Scripts

Host-side helpers. Prefer npm scripts in `package.json` for everyday use.

| Script                 | npm                       | Purpose                             |
| ---------------------- | ------------------------- | ----------------------------------- |
| `generate-jwt-keys.sh` | `npm run keys:generate`   | RS256 PEMs under gitignored `keys/` |
| `scaffold/module.mjs`  | `npm run scaffold:module` | Generate a full domain module slice |

Scaffold docs:
[scaffolding-a-module.md](../docs/guides/scaffolding-a-module.md).

Do not commit `keys/*.pem`. Do not copy them into the Docker image. See
[jwt-keys.md](../docs/deployment/jwt-keys.md) and
[ADR 005](../docs/architecture/decisions/005-jwt-keys-outside-image.md).

Compose orchestration lives under `infra/scripts/` (start/stop stacks and
monitoring). Those scripts do not set `PROCESS_ROLE` inside Node.
