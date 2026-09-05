/**
 * Full module scaffold templates.
 * Placeholders: see buildNames() keys + permission helpers below.
 */

/**
 * @param {ReturnType<import('../lib/naming.mjs').buildNames>} n
 * @param {{ withAudit?: boolean }} [opts]
 */
export function buildTemplateVars(n, opts = {}) {
  return {
    slug: n.folder,
    singular: n.singular,
    plural: n.plural,
    pascal: n.pascal,
    pascalPlural: n.pascalPlural,
    camel: n.camel,
    camelPlural: n.camelPlural,
    constant: n.constant,
    permission: n.permission,
    tag: n.tag,
    title: n.title,
    titlePlural: n.titlePlural,
    mount: n.mount,
    prismaModel: n.prismaModel,
    permRead: `${n.permission}:read`,
    permCreate: `${n.permission}:create`,
    permUpdateOwn: `${n.permission}:update:own`,
    permUpdateAny: `${n.permission}:update:any`,
    permDeleteOwn: `${n.permission}:delete:own`,
    permDeleteAny: `${n.permission}:delete:any`,
    withAudit: Boolean(opts.withAudit),
  };
}

/**
 * @param {Record<string, string>} v
 * @returns {Array<{ relativePath: string, contents: string }>}
 */
export function buildModuleFiles(v) {
  return [
    { relativePath: `src/modules/{{plural}}/README.md`, contents: readme(v) },
    { relativePath: `src/modules/{{plural}}/index.ts`, contents: indexTs(v) },
    {
      relativePath: `src/modules/{{plural}}/domain/entities/{{singular}}.entity.ts`,
      contents: entity(v),
    },
    {
      relativePath: `src/modules/{{plural}}/domain/repositories/{{singular}}.repository.ts`,
      contents: repositoryPort(v),
    },
    {
      relativePath: `src/modules/{{plural}}/domain/errors/{{singular}}.errors.ts`,
      contents: errors(v),
    },
    {
      relativePath: `src/modules/{{plural}}/application/dto/{{singular}}.dto.ts`,
      contents: dto(v),
    },
    {
      relativePath: `src/modules/{{plural}}/application/commands/create-{{singular}}.command.ts`,
      contents: createCommand(v),
    },
    {
      relativePath: `src/modules/{{plural}}/application/commands/update-{{singular}}.command.ts`,
      contents: updateCommand(v),
    },
    {
      relativePath: `src/modules/{{plural}}/application/commands/delete-{{singular}}.command.ts`,
      contents: deleteCommand(v),
    },
    {
      relativePath: `src/modules/{{plural}}/application/queries/get-{{singular}}.query.ts`,
      contents: getQuery(v),
    },
    {
      relativePath: `src/modules/{{plural}}/application/queries/list-{{plural}}.query.ts`,
      contents: listQuery(v),
    },
    {
      relativePath: `src/modules/{{plural}}/application/services/rbac.port.ts`,
      contents: rbacPort(v),
    },
    {
      relativePath: `src/modules/{{plural}}/infrastructure/providers/legacy-adapters.ts`,
      contents: legacyAdapters(v),
    },
    {
      relativePath: `src/modules/{{plural}}/infrastructure/persistence/{{singular}}.mapper.ts`,
      contents: mapper(v),
    },
    {
      relativePath: `src/modules/{{plural}}/infrastructure/repositories/prisma-{{singular}}.repository.ts`,
      contents: prismaRepo(v),
    },
    {
      relativePath: `src/modules/{{plural}}/presentation/serializers/{{singular}}.serializer.ts`,
      contents: serializer(v),
    },
    {
      relativePath: `src/modules/{{plural}}/presentation/schemas/{{singular}}.schemas.ts`,
      contents: schemas(v),
    },
    {
      relativePath: `src/modules/{{plural}}/presentation/controllers/{{singular}}.controller.ts`,
      contents: controller(v),
    },
    {
      relativePath: `src/modules/{{plural}}/presentation/routes/{{singular}}.routes.ts`,
      contents: routes(v),
    },
    { relativePath: `prisma/models/{{singular}}.prisma`, contents: prismaModel(v) },
    {
      relativePath: `docs/api/generator/paths/{{plural}}.js`,
      contents: openapiPaths(v),
    },
    {
      relativePath: `tests/unit/modules/{{plural}}/create-{{singular}}.command.test.ts`,
      contents: unitTest(v),
    },
  ].map((file) => ({
    relativePath: file.relativePath
      .replaceAll('{{plural}}', v.plural)
      .replaceAll('{{singular}}', v.singular),
    contents: file.contents,
  }));
}

function readme(v) {
  return `# ${v.titlePlural} module

Scaffolded bounded context for **${v.titlePlural}**. Replace sample fields and
rules with your domain. Follow
[dependency rules](../../../docs/architecture/dependency-rules.md).

## Layout

\`\`\`
${v.plural}/
├── domain/            # entities, errors, repository ports
├── application/       # commands, queries, DTOs, ports
├── infrastructure/    # Prisma adapter + mapper
├── presentation/      # HTTP routes, validation, serializers
├── index.ts           # create${v.pascal}Module / createDefault${v.pascal}Deps
└── README.md
\`\`\`

## HTTP surface

Mounted at \`{API_PREFIX}${v.mount}\` after container + route wiring.

| Method | Path | Permission |
| ------ | ---- | ---------- |
| GET | \`/\` | public list (adjust as needed) |
| GET | \`/:${v.camel}Id\` | \`${v.permRead}\` |
| POST | \`/\` | \`${v.permCreate}\` |
| PUT | \`/:${v.camel}Id\` | \`${v.permUpdateOwn}\` (\`:any\` elevates) |
| DELETE | \`/:${v.camel}Id\` | \`${v.permDeleteOwn}\` (\`:any\` elevates) |

## Permissions to seed

Add to \`SYSTEM_PERMISSIONS\` in \`src/shared/constants/app.constants.ts\`, then
map onto roles in the RBAC seed (or re-run bootstrap seed):

\`\`\`ts
{ name: '${v.permRead}', resource: '${v.permission}', action: 'read' },
{ name: '${v.permCreate}', resource: '${v.permission}', action: 'create' },
{ name: '${v.permUpdateOwn}', resource: '${v.permission}', action: 'update:own' },
{ name: '${v.permUpdateAny}', resource: '${v.permission}', action: 'update:any' },
{ name: '${v.permDeleteOwn}', resource: '${v.permission}', action: 'delete:own' },
{ name: '${v.permDeleteAny}', resource: '${v.permission}', action: 'delete:any' },
\`\`\`

\`npm run scaffold:module -- ${v.plural} --wire\` can inject these for you.

## Persistence

1. Review \`prisma/models/${v.singular}.prisma\`
2. \`npm run prisma:generate && npm run prisma:push\` (or \`prisma:push:local\`)
3. Soft-delete uses \`prismaNotDeleted\` (Mongo-safe)

## Public API

\`\`\`ts
import {
  create${v.pascal}Module,
  createDefault${v.pascal}Deps,
  create${v.pascal}Router,
} from '@/modules/${v.plural}';
\`\`\`

## Next steps

1. Wire container + routes (or use \`--wire\`)
2. Register OpenAPI path module + \`npm run generate:openapi\`
3. Add catalogue entry in \`docs/architecture/modules.md\`
4. Replace placeholder \`title\` / \`description\` fields with real domain data
5. Add integration tests under \`tests/integration/api/${v.plural}/\`
`;
}

function indexTs(v) {
  const auditImport = v.withAudit
    ? `import { type AuditPort, auditRepository } from '@/shared/infrastructure/audit';\n\n`
    : '';
  const auditDepType = v.withAudit ? `\n  audit?: AuditPort;` : '';
  const auditDefault = v.withAudit ? `\n    audit: overrides.audit ?? auditRepository,` : '';

  return `${auditImport}import type { Router } from 'express';

import { Create${v.pascal}Command } from './application/commands/create-${v.singular}.command';
import { Delete${v.pascal}Command } from './application/commands/delete-${v.singular}.command';
import { Update${v.pascal}Command } from './application/commands/update-${v.singular}.command';
import { Get${v.pascal}Query } from './application/queries/get-${v.singular}.query';
import { List${v.pascalPlural}Query } from './application/queries/list-${v.plural}.query';
import type { ${v.pascal}RbacPort } from './application/services/rbac.port';
import type { ${v.pascal}RepositoryPort } from './domain/repositories/${v.singular}.repository';
import { create${v.pascal}RbacAdapter } from './infrastructure/providers/legacy-adapters';
import { Prisma${v.pascal}Repository } from './infrastructure/repositories/prisma-${v.singular}.repository';
import {
  type ${v.pascal}Controller,
  create${v.pascal}Controller,
} from './presentation/controllers/${v.singular}.controller';
import { create${v.pascal}Routes } from './presentation/routes/${v.singular}.routes';

/**
 * Explicit dependencies for the ${v.title} module.
 */
export type ${v.pascal}ModuleDeps = {
  ${v.camel}Repository: ${v.pascal}RepositoryPort;
  rbac: ${v.pascal}RbacPort;${auditDepType}
};

export type ${v.pascal}Module = {
  deps: ${v.pascal}ModuleDeps;
  useCases: {
    create${v.pascal}: Create${v.pascal}Command;
    update${v.pascal}: Update${v.pascal}Command;
    delete${v.pascal}: Delete${v.pascal}Command;
    get${v.pascal}: Get${v.pascal}Query;
    list${v.pascalPlural}: List${v.pascalPlural}Query;
  };
  controller: ${v.pascal}Controller;
  router: Router;
};

/**
 * Builds default infrastructure adapters.
 * Override any key when wiring a test double or alternate provider.
 */
export function createDefault${v.pascal}Deps(
  overrides: Partial<${v.pascal}ModuleDeps> = {},
): ${v.pascal}ModuleDeps {
  return {
    ${v.camel}Repository: overrides.${v.camel}Repository ?? new Prisma${v.pascal}Repository(),
    rbac: overrides.rbac ?? create${v.pascal}RbacAdapter(),${auditDefault}
  };
}

/**
 * Composition root for the ${v.title} bounded context.
 */
export function create${v.pascal}Module(deps: ${v.pascal}ModuleDeps): ${v.pascal}Module {
  const useCases = {
    create${v.pascal}: new Create${v.pascal}Command(deps),
    update${v.pascal}: new Update${v.pascal}Command(deps),
    delete${v.pascal}: new Delete${v.pascal}Command(deps),
    get${v.pascal}: new Get${v.pascal}Query(deps),
    list${v.pascalPlural}: new List${v.pascalPlural}Query(deps),
  };

  const controller = create${v.pascal}Controller({
    ...useCases,
    rbac: deps.rbac,
  });

  const router = create${v.pascal}Routes(controller);

  return { deps, useCases, controller, router };
}

/** Convenience: fully wired Express router for route registration. */
export function create${v.pascal}Router(overrides: Partial<${v.pascal}ModuleDeps> = {}): Router {
  return create${v.pascal}Module(createDefault${v.pascal}Deps(overrides)).router;
}

export type { ${v.pascal}Entity } from './domain/entities/${v.singular}.entity';
export { Prisma${v.pascal}Repository } from './infrastructure/repositories/prisma-${v.singular}.repository';
export { ${v.camel}Schemas } from './presentation/schemas/${v.singular}.schemas';
export { ${v.pascal}Serializer } from './presentation/serializers/${v.singular}.serializer';
`;
}

function entity(v) {
  return `/**
 * ${v.title} domain entity — no Prisma / ORM types.
 * Infrastructure maps persistence rows to and from this shape.
 */

export type ${v.pascal}Entity = {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type Create${v.pascal}Input = {
  title: string;
  description?: string | null;
  ownerId: string;
};

export type Update${v.pascal}Input = Partial<{
  title: string;
  description: string | null;
  deletedAt: Date | null;
}>;

export type ${v.pascal}ListResult = {
  items: ${v.pascal}Entity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
`;
}

function repositoryPort(v) {
  return `import type {
  Create${v.pascal}Input,
  ${v.pascal}Entity,
  ${v.pascal}ListResult,
  Update${v.pascal}Input,
} from '../entities/${v.singular}.entity';

/**
 * Port for ${v.title} persistence required by use cases.
 * Infrastructure provides a Prisma implementation.
 */
export interface ${v.pascal}RepositoryPort {
  create(data: Create${v.pascal}Input): Promise<${v.pascal}Entity>;
  findById(id: string): Promise<${v.pascal}Entity | null>;
  list(page: number, limit: number): Promise<${v.pascal}ListResult>;
  update(id: string, data: Update${v.pascal}Input): Promise<${v.pascal}Entity>;
}
`;
}

function errors(v) {
  return `import { AppError } from '@/shared/domain/errors/app-error';

/**
 * ${v.title}-specific domain errors for clear failure modes in use cases.
 */
export class ${v.pascal}NotFoundError extends AppError {
  constructor(message = '${v.title} not found') {
    super(404, message, '${v.constant}_NOT_FOUND');
    this.name = '${v.pascal}NotFoundError';
  }
}

export class ${v.pascal}ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to modify this ${v.singular}') {
    super(403, message, '${v.constant}_FORBIDDEN');
    this.name = '${v.pascal}ForbiddenError';
  }
}
`;
}

function dto(v) {
  return `export type Create${v.pascal}Dto = {
  title: string;
  description?: string;
  ownerId: string;
};

export type Update${v.pascal}Dto = {
  id: string;
  actorId: string;
  isAdmin: boolean;
  title?: string;
  description?: string | null;
};

export type Delete${v.pascal}Dto = {
  id: string;
  actorId: string;
  isAdmin: boolean;
};

export type Get${v.pascal}Dto = {
  id: string;
};

export type List${v.pascalPlural}Dto = {
  page: number;
  limit: number;
};
`;
}

function createCommand(v) {
  const auditImport = v.withAudit
    ? `import type { AuditPort } from '@/shared/infrastructure/audit';\n\n`
    : '';
  const auditDep = v.withAudit ? `\n  audit?: AuditPort;` : '';
  const auditCall = v.withAudit
    ? `
    await this.deps.audit?.record({
      actorId: input.ownerId,
      action: '${v.permission}.create',
      resource: '${v.permission}',
      resourceId: created.id,
    });

    return created;`
    : `
    return created;`;

  return `${auditImport}import type { ${v.pascal}Entity } from '../../domain/entities/${v.singular}.entity';
import type { ${v.pascal}RepositoryPort } from '../../domain/repositories/${v.singular}.repository';
import type { Create${v.pascal}Dto } from '../dto/${v.singular}.dto';

export type Create${v.pascal}CommandDeps = {
  ${v.camel}Repository: ${v.pascal}RepositoryPort;${auditDep}
};

/**
 * Creates a ${v.title} owned by the authenticated actor.
 */
export class Create${v.pascal}Command {
  constructor(private readonly deps: Create${v.pascal}CommandDeps) {}

  async execute(input: Create${v.pascal}Dto): Promise<${v.pascal}Entity> {
    const created = await this.deps.${v.camel}Repository.create({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      ownerId: input.ownerId,
    });
${auditCall}
  }
}
`;
}

function updateCommand(v) {
  const auditImport = v.withAudit
    ? `import type { AuditPort } from '@/shared/infrastructure/audit';\n\n`
    : '';
  const auditDep = v.withAudit ? `\n  audit?: AuditPort;` : '';
  const auditCall = v.withAudit
    ? `
    await this.deps.audit?.record({
      actorId: input.actorId,
      action: '${v.permission}.update',
      resource: '${v.permission}',
      resourceId: input.id,
    });

    return updated;`
    : `
    return updated;`;

  return `${auditImport}import type { ${v.pascal}Entity } from '../../domain/entities/${v.singular}.entity';
import { ${v.pascal}ForbiddenError, ${v.pascal}NotFoundError } from '../../domain/errors/${v.singular}.errors';
import type { ${v.pascal}RepositoryPort } from '../../domain/repositories/${v.singular}.repository';
import type { Update${v.pascal}Dto } from '../dto/${v.singular}.dto';

export type Update${v.pascal}CommandDeps = {
  ${v.camel}Repository: ${v.pascal}RepositoryPort;${auditDep}
};

/**
 * Updates a ${v.title}. Owner or admin (\`:any\`) may mutate.
 */
export class Update${v.pascal}Command {
  constructor(private readonly deps: Update${v.pascal}CommandDeps) {}

  async execute(input: Update${v.pascal}Dto): Promise<${v.pascal}Entity> {
    const existing = await this.deps.${v.camel}Repository.findById(input.id);
    if (!existing) {
      throw new ${v.pascal}NotFoundError();
    }

    if (!input.isAdmin && existing.ownerId !== input.actorId) {
      throw new ${v.pascal}ForbiddenError();
    }

    const updated = await this.deps.${v.camel}Repository.update(input.id, {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
    });
${auditCall}
  }
}
`;
}

function deleteCommand(v) {
  const auditImport = v.withAudit
    ? `import type { AuditPort } from '@/shared/infrastructure/audit';\n\n`
    : '';
  const auditDep = v.withAudit ? `\n  audit?: AuditPort;` : '';
  const auditCall = v.withAudit
    ? `
    await this.deps.audit?.record({
      actorId: input.actorId,
      action: '${v.permission}.delete',
      resource: '${v.permission}',
      resourceId: input.id,
    });`
    : '';

  return `${auditImport}import { ${v.pascal}ForbiddenError, ${v.pascal}NotFoundError } from '../../domain/errors/${v.singular}.errors';
import type { ${v.pascal}RepositoryPort } from '../../domain/repositories/${v.singular}.repository';
import type { Delete${v.pascal}Dto } from '../dto/${v.singular}.dto';

export type Delete${v.pascal}CommandDeps = {
  ${v.camel}Repository: ${v.pascal}RepositoryPort;${auditDep}
};

/**
 * Soft-deletes a ${v.title}. Owner or admin (\`:any\`) may delete.
 */
export class Delete${v.pascal}Command {
  constructor(private readonly deps: Delete${v.pascal}CommandDeps) {}

  async execute(input: Delete${v.pascal}Dto): Promise<void> {
    const existing = await this.deps.${v.camel}Repository.findById(input.id);
    if (!existing) {
      throw new ${v.pascal}NotFoundError();
    }

    if (!input.isAdmin && existing.ownerId !== input.actorId) {
      throw new ${v.pascal}ForbiddenError();
    }

    await this.deps.${v.camel}Repository.update(input.id, { deletedAt: new Date() });${auditCall}
  }
}
`;
}

function getQuery(v) {
  return `import type { ${v.pascal}Entity } from '../../domain/entities/${v.singular}.entity';
import { ${v.pascal}NotFoundError } from '../../domain/errors/${v.singular}.errors';
import type { ${v.pascal}RepositoryPort } from '../../domain/repositories/${v.singular}.repository';
import type { Get${v.pascal}Dto } from '../dto/${v.singular}.dto';

export type Get${v.pascal}QueryDeps = {
  ${v.camel}Repository: ${v.pascal}RepositoryPort;
};

/**
 * Fetches a single non-deleted ${v.title} by id.
 */
export class Get${v.pascal}Query {
  constructor(private readonly deps: Get${v.pascal}QueryDeps) {}

  async execute(input: Get${v.pascal}Dto): Promise<${v.pascal}Entity> {
    const item = await this.deps.${v.camel}Repository.findById(input.id);
    if (!item) {
      throw new ${v.pascal}NotFoundError();
    }
    return item;
  }
}
`;
}

function listQuery(v) {
  return `import type { ${v.pascal}ListResult } from '../../domain/entities/${v.singular}.entity';
import type { ${v.pascal}RepositoryPort } from '../../domain/repositories/${v.singular}.repository';
import type { List${v.pascalPlural}Dto } from '../dto/${v.singular}.dto';

export type List${v.pascalPlural}QueryDeps = {
  ${v.camel}Repository: ${v.pascal}RepositoryPort;
};

/**
 * Paginated list of non-deleted ${v.titlePlural}.
 */
export class List${v.pascalPlural}Query {
  constructor(private readonly deps: List${v.pascalPlural}QueryDeps) {}

  async execute(input: List${v.pascalPlural}Dto): Promise<${v.pascal}ListResult> {
    const page = Math.max(1, input.page);
    const limit = Math.min(100, Math.max(1, input.limit));
    return this.deps.${v.camel}Repository.list(page, limit);
  }
}
`;
}

function rbacPort(v) {
  return `/**
 * Narrow RBAC port for ${v.title} ownership elevation checks.
 */
export interface ${v.pascal}RbacPort {
  hasAnyRole(userId: string, roles: string[]): Promise<boolean>;
}
`;
}

function legacyAdapters(v) {
  return `import type { ${v.pascal}RbacPort } from '../../application/services/rbac.port';

/**
 * Default adapters bridging shared RBAC into ${v.title} ports.
 */
export const create${v.pascal}RbacAdapter = (): ${v.pascal}RbacPort => ({
  async hasAnyRole(userId: string, roles: string[]): Promise<boolean> {
    const { rbacService } = await import('@/modules/rbac');
    return rbacService.hasAnyRole(userId, roles);
  },
});
`;
}

function mapper(v) {
  return `import type { ${v.prismaModel} as Prisma${v.pascal} } from '@prisma/client';

import type { ${v.pascal}Entity } from '../../domain/entities/${v.singular}.entity';

/**
 * Maps Prisma ${v.prismaModel} rows ↔ domain ${v.pascal}Entity.
 */
export const ${v.pascal}Mapper = {
  toDomain(row: Prisma${v.pascal}): ${v.pascal}Entity {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      ownerId: row.ownerId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt ?? null,
    };
  },
};
`;
}

function prismaRepo(v) {
  return `import prisma from '@/shared/infrastructure/database/prisma.client';
import { prismaNotDeleted } from '@/shared/infrastructure/database/prisma-soft-delete';

import type {
  Create${v.pascal}Input,
  ${v.pascal}Entity,
  ${v.pascal}ListResult,
  Update${v.pascal}Input,
} from '../../domain/entities/${v.singular}.entity';
import type { ${v.pascal}RepositoryPort } from '../../domain/repositories/${v.singular}.repository';
import { ${v.pascal}Mapper } from '../persistence/${v.singular}.mapper';

/**
 * Mongo-backed ${v.title} persistence via Prisma.
 */
export class Prisma${v.pascal}Repository implements ${v.pascal}RepositoryPort {
  async create(data: Create${v.pascal}Input): Promise<${v.pascal}Entity> {
    const row = await prisma.${v.camel}.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        ownerId: data.ownerId,
        deletedAt: null,
      },
    });
    return ${v.pascal}Mapper.toDomain(row);
  }

  async findById(id: string): Promise<${v.pascal}Entity | null> {
    const row = await prisma.${v.camel}.findFirst({
      where: { id, ...prismaNotDeleted },
    });
    return row ? ${v.pascal}Mapper.toDomain(row) : null;
  }

  async list(page: number, limit: number): Promise<${v.pascal}ListResult> {
    const where = { ...prismaNotDeleted };
    const [rows, total] = await Promise.all([
      prisma.${v.camel}.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.${v.camel}.count({ where }),
    ]);

    return {
      items: rows.map(${v.pascal}Mapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async update(id: string, data: Update${v.pascal}Input): Promise<${v.pascal}Entity> {
    const row = await prisma.${v.camel}.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.deletedAt !== undefined ? { deletedAt: data.deletedAt } : {}),
      },
    });
    return ${v.pascal}Mapper.toDomain(row);
  }
}
`;
}

function serializer(v) {
  return `import type { ${v.pascal}Entity, ${v.pascal}ListResult } from '../../domain/entities/${v.singular}.entity';

/**
 * Maps domain ${v.titlePlural} to the public API response shape.
 */
export const ${v.pascal}Serializer = {
  one(item: ${v.pascal}Entity) {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      ownerId: item.ownerId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  },

  list(result: ${v.pascal}ListResult) {
    return {
      items: result.items.map(${v.pascal}Serializer.one),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  },
};
`;
}

function schemas(v) {
  return `/**
 * ${v.title} express-validator rules (presentation layer).
 */
import { body, param, query } from 'express-validator';

const ${v.camel}IdParam = param('${v.camel}Id')
  .trim()
  .notEmpty()
  .withMessage('${v.title} ID is required')
  .isMongoId()
  .withMessage('${v.title} ID must be a valid Mongo ObjectId');

export const ${v.camel}Schemas = {
  list: [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
  ],

  byId: [${v.camel}IdParam],

  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('title is required')
      .isLength({ min: 2, max: 200 })
      .withMessage('title must be between 2 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('description must be at most 5000 characters'),
  ],

  update: [
    ${v.camel}IdParam,
    body('title')
      .optional()
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('title must be between 2 and 200 characters'),
    body('description')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 5000 })
      .withMessage('description must be at most 5000 characters'),
  ],
};
`;
}

function controller(v) {
  return `import type { Request, Response } from 'express';

import { SYSTEM_ROLES } from '@/shared/constants/app.constants';
import { asyncHandler, response } from '@/shared/utils/http/responses/helpers';

import type { Create${v.pascal}Command } from '../../application/commands/create-${v.singular}.command';
import type { Delete${v.pascal}Command } from '../../application/commands/delete-${v.singular}.command';
import type { Update${v.pascal}Command } from '../../application/commands/update-${v.singular}.command';
import type { Get${v.pascal}Query } from '../../application/queries/get-${v.singular}.query';
import type { List${v.pascalPlural}Query } from '../../application/queries/list-${v.plural}.query';
import type { ${v.pascal}RbacPort } from '../../application/services/rbac.port';
import { ${v.pascal}Serializer } from '../serializers/${v.singular}.serializer';

type AuthenticatedRequest = Request & {
  user?: { id: string };
};

export type ${v.pascal}ControllerDeps = {
  create${v.pascal}: Create${v.pascal}Command;
  update${v.pascal}: Update${v.pascal}Command;
  delete${v.pascal}: Delete${v.pascal}Command;
  get${v.pascal}: Get${v.pascal}Query;
  list${v.pascalPlural}: List${v.pascalPlural}Query;
  rbac: ${v.pascal}RbacPort;
};

/**
 * Thin Express handlers — HTTP concerns only; business rules live in commands/queries.
 */
export function create${v.pascal}Controller(deps: ${v.pascal}ControllerDeps) {
  const isAdmin = async (userId: string): Promise<boolean> =>
    deps.rbac.hasAnyRole(userId, [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SUPER_ADMIN]);

  const list = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await deps.list${v.pascalPlural}.execute({ page, limit });
    return response.ok(req, res, ${v.pascal}Serializer.list(result), '${v.titlePlural} retrieved');
  });

  const getById = asyncHandler(async (req: Request, res: Response) => {
    const item = await deps.get${v.pascal}.execute({ id: req.params.${v.camel}Id });
    return response.ok(req, res, ${v.pascal}Serializer.one(item), '${v.title} retrieved');
  });

  const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const item = await deps.create${v.pascal}.execute({
      title: req.body.title,
      description: req.body.description,
      ownerId: req.user!.id,
    });
    return response.created(req, res, ${v.pascal}Serializer.one(item), '${v.title} created');
  });

  const update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const admin = await isAdmin(req.user!.id);
    const item = await deps.update${v.pascal}.execute({
      id: req.params.${v.camel}Id,
      actorId: req.user!.id,
      isAdmin: admin,
      title: req.body.title,
      description: req.body.description,
    });
    return response.ok(req, res, ${v.pascal}Serializer.one(item), '${v.title} updated');
  });

  const remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const admin = await isAdmin(req.user!.id);
    await deps.delete${v.pascal}.execute({
      id: req.params.${v.camel}Id,
      actorId: req.user!.id,
      isAdmin: admin,
    });
    return response.ok(req, res, null, '${v.title} deleted');
  });

  return { list, getById, create, update, remove };
}

export type ${v.pascal}Controller = ReturnType<typeof create${v.pascal}Controller>;
`;
}

function routes(v) {
  return `import { Router } from 'express';

import {
  authenticate,
  requireActive,
  requirePermission,
  requireVerified,
} from '@/app/middleware/authenticate.middleware';
import { validationErrorHandler } from '@/app/middleware/validation-error.middleware';

import type { ${v.pascal}Controller } from '../controllers/${v.singular}.controller';
import { ${v.camel}Schemas } from '../schemas/${v.singular}.schemas';

/**
 * ${v.title} HTTP routes — mounted at \`/api/v1${v.mount}\`.
 */
export function create${v.pascal}Routes(controller: ${v.pascal}Controller): Router {
  const router = Router();

  /** GET / — Paginated list. */
  router.get('/', ${v.camel}Schemas.list, validationErrorHandler, controller.list);

  /** GET /:${v.camel}Id — Detail (\`${v.permRead}\`). */
  router.get(
    '/:${v.camel}Id',
    authenticate,
    requireVerified,
    requireActive,
    requirePermission('${v.permRead}'),
    ${v.camel}Schemas.byId,
    validationErrorHandler,
    controller.getById,
  );

  /** POST / — Create (\`${v.permCreate}\`). */
  router.post(
    '/',
    authenticate,
    requireVerified,
    requireActive,
    requirePermission('${v.permCreate}'),
    ${v.camel}Schemas.create,
    validationErrorHandler,
    controller.create,
  );

  /** PUT /:${v.camel}Id — Update (\`${v.permUpdateOwn}\`). */
  router.put(
    '/:${v.camel}Id',
    authenticate,
    requireVerified,
    requireActive,
    requirePermission('${v.permUpdateOwn}'),
    ${v.camel}Schemas.update,
    validationErrorHandler,
    controller.update,
  );

  /** DELETE /:${v.camel}Id — Soft-delete (\`${v.permDeleteOwn}\`). */
  router.delete(
    '/:${v.camel}Id',
    authenticate,
    requireVerified,
    requireActive,
    requirePermission('${v.permDeleteOwn}'),
    ${v.camel}Schemas.byId,
    validationErrorHandler,
    controller.remove,
  );

  return router;
}
`;
}

function prismaModel(v) {
  return `// ${v.title} — scaffolded domain model (adjust fields to your business)

model ${v.prismaModel} {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  title       String
  description String?
  ownerId     String    @db.ObjectId
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  @@index([ownerId])
  @@index([createdAt])
  @@index([deletedAt])
}
`;
}

function openapiPaths(v) {
  return `/**
 * ${v.titlePlural} paths — /api/v1${v.mount}
 * Scaffolded contract — refine schemas when the domain solidifies.
 */
const { okContent, bearer, mongoObjectId } = require('../helpers');

module.exports = {
  '/api/v1${v.mount}': {
    get: {
      tags: ['${v.tag}'],
      summary: 'List ${v.titlePlural.toLowerCase()}',
      description: 'Paginated list of non-deleted ${v.titlePlural.toLowerCase()}. Limit capped at 100.',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
      ],
      responses: {
        200: okContent(null, '${v.titlePlural} list'),
        400: { $ref: '#/components/responses/BadRequest' },
      },
    },
    post: {
      tags: ['${v.tag}'],
      summary: 'Create ${v.title.toLowerCase()}',
      description: 'Requires \`${v.permCreate}\`.',
      security: bearer,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title'],
              properties: {
                title: { type: 'string', minLength: 2, maxLength: 200 },
                description: { type: 'string', maxLength: 5000 },
              },
            },
          },
        },
      },
      responses: {
        201: okContent(null, '${v.title} created'),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
      },
    },
  },
  '/api/v1${v.mount}/{${v.camel}Id}': {
    get: {
      tags: ['${v.tag}'],
      summary: 'Get ${v.title.toLowerCase()} by id',
      description: 'Requires \`${v.permRead}\`.',
      security: bearer,
      parameters: [
        { name: '${v.camel}Id', in: 'path', required: true, schema: mongoObjectId },
      ],
      responses: {
        200: okContent(null, '${v.title} detail'),
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
      },
    },
    put: {
      tags: ['${v.tag}'],
      summary: 'Update ${v.title.toLowerCase()}',
      description: 'Requires \`${v.permUpdateOwn}\` (owner) or \`${v.permUpdateAny}\`.',
      security: bearer,
      parameters: [
        { name: '${v.camel}Id', in: 'path', required: true, schema: mongoObjectId },
      ],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string', minLength: 2, maxLength: 200 },
                description: { type: 'string', nullable: true, maxLength: 5000 },
              },
            },
          },
        },
      },
      responses: {
        200: okContent(null, '${v.title} updated'),
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
      },
    },
    delete: {
      tags: ['${v.tag}'],
      summary: 'Soft-delete ${v.title.toLowerCase()}',
      description: 'Requires \`${v.permDeleteOwn}\` (owner) or \`${v.permDeleteAny}\`.',
      security: bearer,
      parameters: [
        { name: '${v.camel}Id', in: 'path', required: true, schema: mongoObjectId },
      ],
      responses: {
        200: okContent(null, '${v.title} deleted'),
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
      },
    },
  },
};
`;
}

function unitTest(v) {
  return `import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Create${v.pascal}Command } from '@/modules/${v.plural}/application/commands/create-${v.singular}.command';
import type { ${v.pascal}RepositoryPort } from '@/modules/${v.plural}/domain/repositories/${v.singular}.repository';

describe('Create${v.pascal}Command', () => {
  let ${v.camel}Repository: ${v.pascal}RepositoryPort;
  let command: Create${v.pascal}Command;

  beforeEach(() => {
    ${v.camel}Repository = {
      create: vi.fn().mockImplementation(async (input) => ({
        id: '507f1f77bcf86cd799439011',
        title: input.title,
        description: input.description ?? null,
        ownerId: input.ownerId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })),
      findById: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
    };

    command = new Create${v.pascal}Command({ ${v.camel}Repository });
  });

  it('creates a ${v.singular} for the owner', async () => {
    const item = await command.execute({
      title: '  Sample ${v.title}  ',
      description: 'desc',
      ownerId: 'user_1',
    });

    expect(${v.camel}Repository.create).toHaveBeenCalledWith({
      title: 'Sample ${v.title}',
      description: 'desc',
      ownerId: 'user_1',
    });
    expect(item.ownerId).toBe('user_1');
    expect(item.title).toBe('Sample ${v.title}');
  });
});
`;
}
