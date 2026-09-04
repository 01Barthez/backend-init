import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { constants as fsConstants } from 'node:fs';

export async function pathExists(path) {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/** Replace `{{key}}` placeholders. */
export function render(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in vars)) {
      throw new Error(`Missing template variable: ${key}`);
    }
    return String(vars[key]);
  });
}

/**
 * Expand path tokens: __singular__ / __plural__
 * @param {string} relativePath
 * @param {{ singular: string, plural: string }} names
 */
export function expandPath(relativePath, names) {
  return relativePath
    .replaceAll('__singular__', names.singular)
    .replaceAll('__plural__', names.plural);
}

/**
 * @param {string} root
 * @param {Array<{ relativePath: string, contents: string }>} files
 * @param {{ force?: boolean, dryRun?: boolean }} opts
 */
export async function writeFiles(root, files, opts = {}) {
  const written = [];
  const skipped = [];

  for (const file of files) {
    const abs = join(root, file.relativePath);
    const exists = await pathExists(abs);

    if (exists && !opts.force) {
      skipped.push(file.relativePath);
      continue;
    }

    if (opts.dryRun) {
      written.push(file.relativePath);
      continue;
    }

    await mkdir(dirname(abs), { recursive: true });
    await writeFile(abs, file.contents, 'utf8');
    written.push(file.relativePath);
  }

  return { written, skipped };
}
