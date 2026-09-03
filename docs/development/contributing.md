# Contributing (docs)

This page summarizes day-to-day contribution expectations for Backend Init. The
authoritative project policy lives in the root
[CONTRIBUTING.md](../../CONTRIBUTING.md). Follow both.

## Branch strategy

| Branch               | Purpose                                  |
| -------------------- | ---------------------------------------- |
| `main`               | Stable default; protected where possible |
| `feat/<short-name>`  | Features                                 |
| `fix/<short-name>`   | Bug fixes                                |
| `docs/<short-name>`  | Documentation-only                       |
| `chore/<short-name>` | Tooling / deps                           |

Prefer short-lived branches and small pull requests.

## Pull request checklist

- [ ] `npm run keys:generate` has been run (boot fails closed without PEMs)
- [ ] Change is scoped; no drive-by refactors
- [ ] Dependency rules respected
      ([dependency-rules.md](../architecture/dependency-rules.md))
- [ ] Tests added or updated when behavior changes
- [ ] `npm run validate` passes locally (lint, type-check, tests, OpenAPI)
- [ ] OpenAPI updated if HTTP contracts changed
- [ ] `.env.example` updated if new configuration was introduced
- [ ] Module catalog / README updated when adding a module
- [ ] Changelog `[Unreleased]` note for user-visible changes

## Code style

- TypeScript strictness as configured in `tsconfig.json`
- Prettier + ESLint via Husky / lint-staged on commit
- kebab-case files and folders; camelCase functions; PascalCase classes / Prisma
  models
- Prefer `@/modules` and `@/shared` imports over legacy paths

See [Coding standards](./coding-standards.md).

## Commit conventions

[Conventional Commits](https://www.conventionalcommits.org/) via Commitlint:

```
feat(auth): rotate refresh tokens on use
fix(users): soft-delete cache invalidation
docs(architecture): document module catalog
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
`build`, `ci`, `chore`, `revert`.

Optional interactive helper: Commitizen (`cz-conventional-changelog`).

## Review expectations

Reviewers focus on correctness, security (authz, secrets, uploads), dependency
direction, and operational impact — not personal preference bikeshedding.

## Related

- Root [CONTRIBUTING.md](../../CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md)
- [SECURITY.md](../../SECURITY.md)
