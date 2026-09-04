#!/usr/bin/env node
/**
 * Scaffold a new bounded-context module (complete CRUD vertical slice).
 *
 * Usage:
 *   npm run scaffold:module -- <name> [options]
 *   node scripts/scaffold/module.mjs orders --wire
 *
 * Options:
 *   --wire       Patch container, routes, OpenAPI index/tags, SYSTEM_PERMISSIONS, RBAC seed
 *   --force      Overwrite existing generated files
 *   --dry-run    Print actions without writing
 *   --mount <p>  Override URL/folder plural (default: pluralized name)
 *   --help       Show help
 */

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { pathExists, writeFiles } from './lib/fs.mjs';
import { buildNames } from './lib/naming.mjs';
import { wireModule } from './lib/wire.mjs';
import { buildModuleFiles, buildTemplateVars } from './templates/module.templates.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

function printHelp() {
  console.log(`
Scaffold a Backend Init domain module (full vertical slice).

Usage:
  npm run scaffold:module -- <name> [options]

Arguments:
  <name>          Module name (order, orders, order-item, Invoice…)

Options:
  --wire          Wire container, routes, OpenAPI, permissions + RBAC seed
  --force         Overwrite files if they already exist
  --dry-run       Show what would be created / patched
  --mount <slug>  Force mount/folder plural (e.g. --mount catalog-items)
  --help          Show this help

Examples:
  npm run scaffold:module -- orders
  npm run scaffold:module -- invoice --wire
  npm run scaffold:module -- order-item --mount order-items --dry-run

Generates:
  • src/modules/<plural>/   domain → application → infrastructure → presentation
  • prisma/models/<singular>.prisma
  • docs/api/generator/paths/<plural>.js
  • tests/unit/modules/<plural>/create-<singular>.command.test.ts
`);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    wire: false,
    force: false,
    dryRun: false,
    mount: undefined,
    help: false,
    name: undefined,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg === '--wire') opts.wire = true;
    else if (arg === '--force') opts.force = true;
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--mount') {
      opts.mount = args[i + 1];
      i += 1;
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else if (!opts.name) {
      opts.name = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  return opts;
}

function printBanner(names, opts) {
  console.log(`
┌──────────────────────────────────────────────────────────┐
│  Backend Init — module scaffold                          │
├──────────────────────────────────────────────────────────┤
│  module     ${names.pascal.padEnd(43)}│
│  folder     src/modules/${names.folder.padEnd(33)}│
│  mount      {API_PREFIX}${names.mount.padEnd(35)}│
│  prisma     ${names.prismaModel.padEnd(43)}│
│  wire       ${String(opts.wire).padEnd(43)}│
│  dry-run    ${String(opts.dryRun).padEnd(43)}│
└──────────────────────────────────────────────────────────┘
`);
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  if (opts.help || !opts.name) {
    printHelp();
    process.exitCode = opts.help ? 0 : 1;
    return;
  }

  let names;
  try {
    names = buildNames(opts.name, { mount: opts.mount });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  printBanner(names, opts);

  const moduleDir = join(ROOT, 'src/modules', names.folder);
  if ((await pathExists(moduleDir)) && !opts.force && !opts.dryRun) {
    console.error(
      `Module folder already exists: src/modules/${names.folder}\n` +
        `Re-run with --force to overwrite scaffold files, or pick another name.`,
    );
    process.exitCode = 1;
    return;
  }

  const vars = buildTemplateVars(names);
  const files = buildModuleFiles(vars);
  const { written, skipped } = await writeFiles(ROOT, files, {
    force: opts.force,
    dryRun: opts.dryRun,
  });

  console.log(opts.dryRun ? 'Would write:' : 'Wrote:');
  for (const file of written) {
    console.log(`  + ${file}`);
  }
  if (skipped.length) {
    console.log('\nSkipped (exists, use --force):');
    for (const file of skipped) {
      console.log(`  · ${file}`);
    }
  }

  if (opts.wire) {
    console.log(opts.dryRun ? '\nWould wire:' : '\nWired:');
    const steps = await wireModule(ROOT, names, { dryRun: opts.dryRun });
    for (const step of steps) {
      const rel = step.path.replace(`${ROOT}/`, '');
      console.log(`  ${step.status.padEnd(12)} ${rel}`);
    }
  }

  console.log(`
Next steps:
  1. Review prisma/models/${names.singular}.prisma then:
       npm run prisma:generate && npm run prisma:push
  2. ${opts.wire ? 'Already wired — restart the API process.' : 'Wire manually or re-run with --wire'}
  3. npm run generate:openapi
  4. npm run test:unit -- tests/unit/modules/${names.plural}
  5. Document the module in docs/architecture/modules.md
  6. Replace placeholder title/description fields with real domain data

Docs: docs/guides/scaffolding-a-module.md
`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
