# Architecture

System design for Backend Init: modular monolith, layer boundaries, and
extension points.

## Documents

| Document                                  | Purpose                              |
| ----------------------------------------- | ------------------------------------ |
| [Overview](./overview.md)                 | Folder map, layers, request flow     |
| [Modules catalog](./modules.md)           | Bounded contexts under `src/modules` |
| [Dependency rules](./dependency-rules.md) | Allowed and forbidden imports        |
| [Extending](./extending.md)               | Add a module end to end              |
| [Configuration](./configuration.md)       | `src/app/config` design              |
| [ADRs](./decisions/README.md)             | Architecture decision records        |

Start with the overview, then dependency rules before adding cross-module
imports.
