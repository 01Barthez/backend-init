# Installez les dépendances
npm install --save-dev @commitlint/{config-conventional,cli} husky lint-staged

# Initialisez Husky :
npx husky install
npm pkg set scripts.prepare="husky install"
npm run prepare

# Ajoutez les hooks
npx husky add .husky/pre-commit "npx lint-staged"
npx husky add .husky/pre-push "npm test"
npx husky add .husky/commit-msg 'npx --no-install commitlint --edit "$1"'


# Outils de formatage et de qualité de code
npm install --save-dev prettier eslint eslint-config-prettier eslint-plugin-prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-import eslint-plugin-unused-imports eslint-plugin-simple-import-sort eslint-plugin-sonarjs eslint-plugin-security eslint-plugin-promise eslint-plugin-unicorn eslint-plugin-node

# Outils pour les hooks Git
npm install --save-dev husky lint-staged

# Outils de test et couverture
npm install --save-dev jest ts-jest @types/jest jest-sonar-reporter

# Outils de sécurité
npm install --save-dev npm-audit-resolver audit-ci

# Outils de documentation
npm install --save-dev typedoc @microsoft/api-extractor
