// .prettierrc.js
module.exports = {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  jsxSingleQuote: false,
  trailingComma: 'all',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  endOfLine: 'lf',
  singleAttributePerLine: true,
  embeddedLanguageFormatting: 'off',
  overrides: [
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
        tabWidth: 2,
        useTabs: false,
        singleQuote: true,
        trailingComma: 'es5',
        bracketSpacing: true,
        bracketSameLine: false,
        semi: true,
        arrowParens: 'always',
        endOfLine: 'lf',
      },
    },
    {
      files: '*.{yaml,yml}',
      options: {
        singleQuote: true,
        tabWidth: 2,
      },
    },
    {
      files: '*.json',
      options: {
        singleQuote: false,
      },
    },
  ],
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  importOrder: ['^react', '<THIRD_PARTY_MODULES>', '^@/.*', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
