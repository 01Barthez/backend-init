# Architecture Decision Records

This folder records significant technical decisions for Backend Init.

## Format

Each ADR is numbered and immutable once accepted. Superseding a decision means
writing a new ADR that references the old one.

Suggested sections: **Status**, **Context**, **Decision**, **Consequences**.

## Index

| ADR                                  | Title                               | Status   |
| ------------------------------------ | ----------------------------------- | -------- |
| [001](./001-modular-monolith.md)     | Modular monolith over microservices | Accepted |
| [002](./002-database.md)             | Prisma + MongoDB                    | Accepted |
| [003](./003-dependency-injection.md) | Manual container over DI frameworks | Accepted |

## When to write an ADR

Write one when you:

- Change persistence technology or auth scheme
- Introduce a new cross-cutting framework (DI, CQRS bus, ORM)
- Split or merge bounded contexts in a breaking way
- Adopt a hard dependency rule that contributors must follow
