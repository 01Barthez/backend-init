# MongoDB indexes and search

Prisma against Mongo does **not** run SQL-style migrations. Indexes declared in
`prisma/models/*.prisma` (`@@index`, `@@unique`) are applied when you run
`prisma db push` (or an equivalent schema sync). Treat that as a deliberate ops
step — never a silent side-effect of a production deploy.

## Never silent-push to production

| Do                                                                 | Don't                                                     |
| ------------------------------------------------------------------ | --------------------------------------------------------- |
| Review `prisma/models` diffs in the PR                             | Run `prisma db push` from CI without review               |
| Apply indexes in a maintenance window when the collection is large | Assume `db push` is as safe as a reversible SQL migration |
| Keep a checklist (below) in the change ticket                      | Rely on “it worked in staging” alone for unique indexes   |

Prisma Mongo `db push` can add indexes and change uniqueness constraints. On a
busy collection that can block writes while the index builds. Prefer Atlas
rolling index builds for large production data sets.

## Index checklist (before production sync)

1. Diff `prisma/models/**` — list every new/changed `@@index` / `@@unique`.
2. Estimate collection size and write rate for each indexed collection.
3. Confirm query patterns match the index (filter + sort fields, left-prefix).
4. Staging: `npm run prisma:generate && npm run prisma:push` against a realistic
   copy; verify explain plans.
5. Production: schedule the sync; monitor index build progress in Atlas /
   `db.currentOp()`.
6. Roll forward only — document how to drop an unused index if the change is
   reverted in code.

Also see `prisma/README.md`.

## Atlas Search (users / blog)

Default `SearchPort` (`MongoSearchAdapter`) uses Prisma `contains` filters with
a **hard max of 100** hits. Query string length is capped at the presentation
layer (blog `q` ≤ 200, users search ≤ 100).

That is fine for demos and small catalogs. For production user/blog search:

- Prefer **MongoDB Atlas Search** (or Typesense / Meilisearch) behind
  `SearchPort`.
- Keep compound indexes (e.g. `AuditLog` `action + createdAt`) for equality /
  range admin queries — they are not a substitute for full-text relevance.
- Do not raise the adapter hard max without pagination and a real search engine.

Wire a dedicated adapter in `src/shared/infrastructure/search/` and inject it
via the blog/users module deps when you outgrow `contains`.
