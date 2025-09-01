// .lintstagedrc.js
const path = require('path');

const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(' --file ')}`.trim();
module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'prettier --write',
    buildEslintCommand,
    'jest --bail --findRelatedTests --passWithNoTests',
  ],
  '*.{json,md,mdx,yml,yaml}': ['prettier --write'],
  '*.{css,scss}': ['stylelint --fix', 'prettier --write'],
};
