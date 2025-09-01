const path = require('path');

module.exports = {
  addAliases: (aliases, name) => {
    const basePath = path.join(__dirname, 'dist');
    return {
      ...aliases,
      '@': basePath,
      '@config': path.join(basePath, 'config'),
      '@services': path.join(basePath, 'services'),
      '@middlewares': path.join(basePath, 'middlewares'),
      '@router': path.join(basePath, 'router'),
      '@utils': path.join(basePath, 'utils'),
      '@controllers': path.join(basePath, 'controllers'),
    };
  },
};
