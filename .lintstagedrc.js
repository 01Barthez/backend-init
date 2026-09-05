/**
 * Lint-staged for this Express + TypeScript backend (not Next.js).
 */
module.exports = {
  // --no-warn-ignored: tests/, docs/, k6 are in eslint ignores; lint-staged still
  // passes them and ESLint would otherwise emit one warning per file (fails max-warnings).
  '*.{ts,tsx,js,jsx}': ['prettier --write', 'eslint --max-warnings=10 --fix --no-warn-ignored'],
  '*.{json,yml,yaml,mjs}': ['prettier --write'],
  // Markdown: format only here; markdownlint runs in CI / lint:md (avoids double-run + OOM).
  '*.{md,mdx}': ['prettier --write'],
};
