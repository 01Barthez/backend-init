# Blog module

Vertical slice for blog posts: create, update, publish, soft-delete, and public
listing.

## Layout

```
blog/
├── domain/            # Blog entity, repository port, domain errors
├── application/       # Commands / queries + cache / RBAC ports
├── infrastructure/    # Prisma repo, mapper, legacy adapters
├── presentation/      # Thin Express controllers, routes, validators, serializers
├── index.ts           # createBlogModule / createBlogRouter
└── README.md
```

## Dependency rules

| Layer          | May depend on                  | Must not import        |
| -------------- | ------------------------------ | ---------------------- |
| Domain         | shared domain (`AppError`)     | Express, Prisma, Redis |
| Application    | Domain ports + DTOs            | Express, Prisma        |
| Infrastructure | Domain ports (implements them) | Presentation           |
| Presentation   | Application use cases          | Prisma directly        |

## Public API

```ts
import { createBlogRouter, createBlogModule, createDefaultBlogDeps } from '@/modules/blog';

app.use(`${prefix}/blogs`, createBlogRouter());

const blog = createBlogModule(
  createDefaultBlogDeps({
    cache: undefined, // skip caching in tests
  }),
);
```

## Extension points

1. **BlogRepositoryPort** — replace Prisma with another store.
2. **BlogCachePort** — swap Redis/local cache or disable for tests.
3. **BlogRbacPort** — point at the future rbac module.

## Compatibility

- `src/routes/blogs/blogs.routes.ts` re-exports `createBlogRouter()`.
- Legacy `src/services/blog/blog.service.ts` re-exports module use cases via a
  thin facade.
- Legacy `src/services/validator/validate/blogs.ts` re-exports `blogSchemas`.
