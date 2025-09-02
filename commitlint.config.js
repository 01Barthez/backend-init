module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'scope-case': [0, 'always', 'lower-case'],
    'scope-empty': [1, 'never'], // ⚠️ warning instead of error
    'subject-case': [0, 'never'],
    'subject-max-length': [2, 'always', 100],
  },
  prompt: {
    messages: {
      type: 'Select the type of commit:',
      scope: 'Define the scope (optional):',
      subject: 'Write a short and clear subject:',
      body: 'Detailed description (optional):',
      footer: 'References or tickets (optional):',
    },
  },
};
