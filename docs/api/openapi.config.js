/**
 * OpenAPI 3.0.3 generator for Backend Init.
 *
 * Source of truth for the consolidated spec. Run:
 *   node docs/api/openapi.config.js
 *   npm run generate:openapi
 *
 * Writes:
 *   - docs/api/openapi.yaml
 *
 * Path/operation definitions live under docs/api/generator/.
 * Keep in sync with module routers under src/modules/.../presentation/routes
 * and the mount table in src/app/routes/index.ts.
 */
const path = require('path');
const fs = require('fs');
const yaml = require('yamljs');
const { info, servers, tags } = require('./generator/info');
const components = require('./generator/components');
const paths = require('./generator/paths');

const definition = {
  openapi: '3.0.3',
  info,
  servers,
  tags,
  components,
  paths,
};

const yamlContent = yaml.stringify(definition, 10, 2);
const primaryPath = path.join(__dirname, 'openapi.yaml');

fs.writeFileSync(primaryPath, yamlContent, 'utf8');
console.log(`OpenAPI spec written to ${primaryPath}`);

module.exports = { definition };
