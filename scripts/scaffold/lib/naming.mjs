/**
 * Module naming helpers for the scaffold CLI.
 * Input may be singular or plural (order | orders | OrderItem).
 */

const toKebab = (value) =>
  String(value)
    .trim()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/-+/g, '-')
    .toLowerCase()
    .replace(/^-|-$/g, '');

const kebabToCamel = (kebab) =>
  kebab.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

const kebabToPascal = (kebab) => {
  const camel = kebabToCamel(kebab);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
};

const singularize = (kebab) => {
  if (kebab.endsWith('ies') && kebab.length > 3) {
    return `${kebab.slice(0, -3)}y`;
  }
  if (/(ses|xes|zes|ches|shes)$/.test(kebab)) {
    return kebab.slice(0, -2);
  }
  if (kebab.endsWith('s') && !kebab.endsWith('ss') && kebab.length > 1) {
    return kebab.slice(0, -1);
  }
  return kebab;
};

const pluralize = (kebab) => {
  if (kebab.endsWith('s') && !kebab.endsWith('ss')) {
    return kebab;
  }
  if (/[^aeiou]y$/.test(kebab)) {
    return `${kebab.slice(0, -1)}ies`;
  }
  if (/(s|x|z|ch|sh)$/.test(kebab)) {
    return `${kebab}es`;
  }
  return `${kebab}s`;
};

/**
 * @param {string} input
 * @param {{ mount?: string }} [opts]
 */
export function buildNames(input, opts = {}) {
  if (!input || !String(input).trim()) {
    throw new Error('Module name is required (e.g. orders, invoice, order-item)');
  }

  const rawKebab = toKebab(input);
  if (!/^[a-z][a-z0-9-]*$/.test(rawKebab)) {
    throw new Error(
      `Invalid module name "${input}". Use letters, numbers, and hyphens (e.g. orders).`,
    );
  }

  const reserved = new Set([
    'auth',
    'users',
    'user',
    'blog',
    'blogs',
    'oauth',
    'files',
    'file',
    'rbac',
    'system',
    'admin',
    'health',
    'metrics',
    'shared',
    'app',
  ]);
  if (reserved.has(rawKebab) || reserved.has(singularize(rawKebab))) {
    throw new Error(
      `"${rawKebab}" conflicts with an existing template module. Pick another name.`,
    );
  }

  const singular = singularize(rawKebab);
  const plural = opts.mount ? toKebab(opts.mount) : pluralize(singular);

  if (!/^[a-z][a-z0-9-]*$/.test(plural)) {
    throw new Error(`Invalid mount path "${plural}"`);
  }

  const pascal = kebabToPascal(singular);
  const pascalPlural = kebabToPascal(plural);
  const camel = kebabToCamel(singular);
  const camelPlural = kebabToCamel(plural);
  const constant = singular.replace(/-/g, '_').toUpperCase();
  const permission = singular.replace(/-/g, '_');

  return {
    input: String(input).trim(),
    singular,
    plural,
    pascal,
    pascalPlural,
    camel,
    camelPlural,
    constant,
    permission,
    tag: pascalPlural,
    title: pascal.replace(/([a-z])([A-Z])/g, '$1 $2'),
    titlePlural: pascalPlural.replace(/([a-z])([A-Z])/g, '$1 $2'),
    folder: plural,
    mount: `/${plural}`,
    prismaModel: pascal,
  };
}
