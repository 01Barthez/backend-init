# Contributing to Backend Init

Thank you for investing time in this template. Clear, small changes keep the
modular architecture healthy for every fork.

## Code of conduct

Participation is governed by [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Getting started

1. Fork and clone the repository.
2. Follow
   [docs/development/getting-started.md](./docs/development/getting-started.md).
3. Create a topic branch from `main`.

## Development workflow

```bash
npm install
npm run keys:generate
npm run docker:up
npm run prisma:generate
npm run prisma:push
npm run dev
```

Boot fails closed without JWT PEMs. `npm run validate` also needs keys generated
when any path loads runtime config.

Before opening a pull request:

```bash
npm run validate
```

That runs ESLint (CI strictness), TypeScript `--noEmit`, Vitest, and OpenAPI
validation.

## Branch naming

- `feat/<summary>` — new capability
- `fix/<summary>` — bug fix
- `docs/<summary>` — documentation
- `chore/<summary>` — tooling / deps
- `refactor/<summary>` — internal restructuring without behavior change

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/). Commitlint
enforces types:

`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`,
`chore`, `revert`

Examples:

```
feat(oauth): add LinkedIn profile avatar mapping
fix(auth): invalidate refresh token on password change
docs(modules): document backup worker entry point
```

## Pull requests

- Keep PRs focused; separate refactors from features when practical.
- Respect [dependency rules](./docs/architecture/dependency-rules.md).
- Update OpenAPI when HTTP contracts change (`npm run generate:openapi`).
- Update `.env.example` and docs when configuration changes.
- Add or adjust tests for behavioral changes.
- Note user-visible changes under `[Unreleased]` in
  [CHANGELOG.md](./CHANGELOG.md).

### Review checklist (author)

- [ ] `npm run keys:generate` has been run locally
- [ ] No secrets committed
- [ ] Domain layer free of Express/Prisma imports
- [ ] New modules registered in container + routes when applicable
- [ ] `npm run validate` passes

## Architecture expectations

- Prefer extending `src/modules/*` and `src/shared/*` over growing a type-based
  dump (`controllers/`, `services/` only).
- New bounded contexts: follow
  [docs/architecture/extending.md](./docs/architecture/extending.md).
- Significant technical shifts need an ADR under `docs/architecture/decisions/`.

## Reporting bugs

Open a GitHub issue with reproduction steps, expected vs actual behavior, and
environment (Node, OS, Docker). For vulnerabilities, use
[SECURITY.md](./SECURITY.md) — do not file public issues for exploitable flaws.

## License

By contributing, you agree that your contributions are licensed under the MIT
License ([LICENSE](./LICENSE)).
