/**
 * Lint-staged for this Express + TypeScript backend (not Next.js).
 */
module.exports = {
  '*.{ts,tsx,js,jsx}': ['prettier --write', 'eslint --max-warnings=10 --fix'],
  '*.{json,yml,yaml,mjs}': ['prettier --write'],
  // Markdown: format only here; markdownlint runs in CI / lint:md (avoids double-run + OOM).
  '*.{md,mdx}': ['prettier --write'],
};
