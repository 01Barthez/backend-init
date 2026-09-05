import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Apply the first matching search/replace. Returns original source when none match.
 * @param {string} src
 * @param {Array<{ find: RegExp|string, replace: string }>} attempts
 */
function replaceFirst(src, attempts) {
  for (const { find, replace } of attempts) {
    if (typeof find === 'string') {
      if (src.includes(find)) {
        return src.replace(find, replace);
      }
    } else if (find.test(src)) {
      return src.replace(find, replace);
    }
  }
  return src;
}

/**
 * @param {string} root
 * @param {ReturnType<import('../lib/naming.mjs').buildNames>} names
 * @param {{ dryRun?: boolean }} opts
 */
export async function wireModule(root, names, opts = {}) {
  const steps = [];

  steps.push(await patchContainer(root, names, opts));
  steps.push(await patchRoutes(root, names, opts));
  steps.push(await patchOpenApiIndex(root, names, opts));
  steps.push(await patchOpenApiTags(root, names, opts));
  steps.push(await patchPermissions(root, names, opts));
  steps.push(await patchRbacAdminSeed(root, names, opts));
  steps.push(await patchRbacUserSeed(root, names, opts));

  return steps;
}

async function patchFile(path, transform, opts) {
  const before = await readFile(path, 'utf8');
  const after = transform(before);
  if (after === before) {
    return { path, status: 'unchanged' };
  }
  if (opts.dryRun) {
    return { path, status: 'would-patch' };
  }
  await writeFile(path, after, 'utf8');
  return { path, status: 'patched' };
}

async function patchContainer(root, names, opts) {
  const path = join(root, 'src/app/container/index.ts');
  return patchFile(
    path,
    (src) => {
      if (src.includes(`create${names.pascal}Module`)) return src;

      let next = src;
      const importLine = `import { type ${names.pascal}Module, create${names.pascal}Module, createDefault${names.pascal}Deps } from '@/modules/${names.plural}';\n`;
      if (!next.includes(importLine.trim())) {
        next = replaceFirst(next, [
          {
            find: /(import \{ type FilesModule[\s\S]*?from '@\/modules\/files';\n)/,
            replace: `$1${importLine}`,
          },
          {
            find: /(import \{ type BlogModule[\s\S]*?from '@\/modules\/blog';\n)/,
            replace: `$1${importLine}`,
          },
        ]);
      }

      next = replaceFirst(next, [
        {
          find: /(export type AppContainer = \{[\s\S]*?)(system: SystemRouters;\n\};)/,
          replace: `$1${names.camelPlural}: ${names.pascal}Module;\n  $2`,
        },
      ]);

      next = replaceFirst(next, [
        {
          find: /(export type ContainerOverrides = \{[\s\S]*?)(files\?: Parameters[\s\S]*?\n\};)/,
          replace: `$1${names.camelPlural}?: Parameters<typeof createDefault${names.pascal}Deps>[0];\n  $2`,
        },
        {
          find: /(export type ContainerOverrides = \{[\s\S]*?)(blog\?: Parameters[\s\S]*?\n\};)/,
          replace: `$1${names.camelPlural}?: Parameters<typeof createDefault${names.pascal}Deps>[0];\n  $2`,
        },
      ]);

      next = replaceFirst(next, [
        {
          find: /(const files = createFilesModule\(createDefaultFilesDeps\(overrides\.files\)\);\n)/,
          replace: `$1  const ${names.camelPlural} = create${names.pascal}Module(createDefault${names.pascal}Deps(overrides.${names.camelPlural}));\n`,
        },
        {
          find: /(const blog = createBlogModule\(createDefaultBlogDeps\(overrides\.blog\)\);\n)/,
          replace: `$1  const ${names.camelPlural} = create${names.pascal}Module(createDefault${names.pascal}Deps(overrides.${names.camelPlural}));\n`,
        },
      ]);

      next = replaceFirst(next, [
        {
          find: 'return { auth, users, rbac, blog, oauth, files, system };',
          replace: `return { auth, users, rbac, blog, oauth, files, ${names.camelPlural}, system };`,
        },
        {
          find: /(return \{ auth, users, rbac, blog, oauth, files)(, system \};)/,
          replace: `$1, ${names.camelPlural}$2`,
        },
      ]);

      return next;
    },
    opts,
  );
}

async function patchRoutes(root, names, opts) {
  const path = join(root, 'src/app/routes/index.ts');
  return patchFile(
    path,
    (src) => {
      if (src.includes(`container.${names.camelPlural}.router`)) return src;
      const mount = `  api.use('${names.mount}', rateLimitingSubRoute, container.${names.camelPlural}.router);\n`;
      return replaceFirst(src, [
        {
          find: /(api\.use\('\/files', rateLimitingSubRoute, container\.files\.router\);\n)/,
          replace: `$1${mount}`,
        },
        {
          find: /(api\.use\('\/blogs', rateLimitingSubRoute, container\.blog\.router\);\n)/,
          replace: `$1${mount}`,
        },
      ]);
    },
    opts,
  );
}

async function patchOpenApiIndex(root, names, opts) {
  const path = join(root, 'docs/api/generator/paths/index.js');
  return patchFile(
    path,
    (src) => {
      if (src.includes(`require('./${names.plural}')`)) return src;
      let next = replaceFirst(src, [
        {
          find: /(const files = require\('\.\/files'\);\n)/,
          replace: `$1const ${names.camelPlural} = require('./${names.plural}');\n`,
        },
        {
          find: /(const blogs = require\('\.\/blogs'\);\n)/,
          replace: `$1const ${names.camelPlural} = require('./${names.plural}');\n`,
        },
      ]);
      next = replaceFirst(next, [
        {
          find: /(\.\.\.blogs,\n)/,
          replace: `$1  ...${names.camelPlural},\n`,
        },
        {
          find: /(\.\.\.files,\n)/,
          replace: `$1  ...${names.camelPlural},\n`,
        },
      ]);
      return next;
    },
    opts,
  );
}

async function patchOpenApiTags(root, names, opts) {
  const path = join(root, 'docs/api/generator/info.js');
  return patchFile(
    path,
    (src) => {
      if (src.includes(`name: '${names.tag}'`)) return src;
      const tag = `  {\n    name: '${names.tag}',\n    description: 'Scaffolded ${names.titlePlural} domain — replace with real business rules',\n  },\n`;
      return replaceFirst(src, [
        {
          find: /({\n    name: 'Files',[\s\S]*?},)/,
          replace: `$1\n${tag}`,
        },
        {
          find: /({\n    name: 'Blog',[\s\S]*?},)/,
          replace: `$1\n${tag}`,
        },
      ]);
    },
    opts,
  );
}

async function patchPermissions(root, names, opts) {
  const path = join(root, 'src/shared/constants/app.constants.ts');
  return patchFile(
    path,
    (src) => {
      if (src.includes(`'${names.permission}:create'`)) return src;
      const block = `  { name: '${names.permission}:read', resource: '${names.permission}', action: 'read' },
  { name: '${names.permission}:create', resource: '${names.permission}', action: 'create' },
  { name: '${names.permission}:update:own', resource: '${names.permission}', action: 'update:own' },
  { name: '${names.permission}:update:any', resource: '${names.permission}', action: 'update:any' },
  { name: '${names.permission}:delete:own', resource: '${names.permission}', action: 'delete:own' },
  { name: '${names.permission}:delete:any', resource: '${names.permission}', action: 'delete:any' },
`;
      return replaceFirst(src, [
        {
          find: /({\s*name: 'audit:read',\s*resource: 'audit',\s*action: 'read'\s*},)/,
          replace: `${block}  $1`,
        },
        {
          find: /({\s*name: 'blog:publish',\s*resource: 'blog',\s*action: 'publish'\s*},)/,
          replace: `$1\n${block}`,
        },
      ]);
    },
    opts,
  );
}

async function patchRbacAdminSeed(root, names, opts) {
  const path = join(root, 'src/modules/rbac/infrastructure/repositories/prisma-rbac.repository.ts');
  return patchFile(
    path,
    (src) => {
      if (src.includes(`'${names.permission}:update:any'`)) return src;
      const perms = `          '${names.permission}:read',
          '${names.permission}:create',
          '${names.permission}:update:own',
          '${names.permission}:update:any',
          '${names.permission}:delete:own',
          '${names.permission}:delete:any',
`;
      return replaceFirst(src, [
        {
          find: /(blog:publish',\n\s*'audit:read',)/,
          replace: `blog:publish',\n${perms}          'audit:read',`,
        },
        {
          find: /('blog:publish',\n)/,
          replace: `'blog:publish',\n${perms}`,
        },
      ]);
    },
    opts,
  );
}

async function patchRbacUserSeed(root, names, opts) {
  const path = join(root, 'src/modules/rbac/infrastructure/repositories/prisma-rbac.repository.ts');
  return patchFile(
    path,
    (src) => {
      if (src.includes(`'${names.permission}:create'`)) {
        // May already be on admin seed only — still try user block below.
      }
      if (
        src.includes(`perms: ['blog:read', 'blog:create'`) &&
        !src.includes(`'${names.permission}:create'`)
      ) {
        return src.replace(
          /(perms: \['blog:read', 'blog:create', 'blog:update:own', 'blog:delete:own', 'blog:publish'\])/,
          `perms: ['blog:read', 'blog:create', 'blog:update:own', 'blog:delete:own', 'blog:publish', '${names.permission}:read', '${names.permission}:create', '${names.permission}:update:own', '${names.permission}:delete:own']`,
        );
      }
      return src;
    },
    opts,
  );
}
