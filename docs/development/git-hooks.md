# Git hooks (Husky)

Local quality gates that mirror CI. Installed via `npm prepare` → `husky`.

| Hook               | Runs                                           | Purpose                                            |
| ------------------ | ---------------------------------------------- | -------------------------------------------------- |
| `pre-commit`       | `npx lint-staged`                              | Format + ESLint (and markdownlint) on staged files |
| `commit-msg`       | `commitlint`                                   | Conventional Commits (`feat`, `fix`, `docs`, …)    |
| `pre-merge-commit` | `lint:ci` + `type-check`                       | Block merges that break the tree                   |
| `pre-push`         | `lint:ci` + `type-check` + `test:unit`         | Block broken pushes before CI                      |
| `post-merge`       | `prisma:generate` when schema/lockfile changed | Keep Prisma client in sync                         |
| `post-checkout`    | same as post-merge                             | Same after branch switches                         |

## Intentionally omitted

| Hook                              | Reason                                                                     |
| --------------------------------- | -------------------------------------------------------------------------- |
| `post-push`                       | Not a standard Git/Husky hook; push success feedback belongs in CI         |
| `prepare-commit-msg` (Commitizen) | Interactive TTY only — hangs agents/CI; use `npx cz` manually when desired |

## Skip (emergency only)

```bash
HUSKY=0 git commit -m "…"   # skip all husky hooks
git commit --no-verify      # skip pre-commit + commit-msg (discouraged)
```

Do not use `--no-verify` on shared branches.

## Related

- `commitlint.config.js` — allowed types
- `package.json` → `lint-staged`
- CI: `.github/workflows/ci.yml` still runs the full matrix
- Security: `.github/workflows/security.yml` (npm audit, Trivy, OSV, gitleaks)
