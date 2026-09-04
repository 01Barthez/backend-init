/**
 * Merge domain path objects. Order matches the historical monolith
 * (files between audit and /admin/queues) so generated YAML stays stable.
 */
const auth = require('./auth');
const oauth = require('./oauth');
const users = require('./users');
const blogs = require('./blogs');
const files = require('./files');
const system = require('./system');

const adminQueues = system['/admin/queues'];
const systemWithoutQueues = { ...system };
delete systemWithoutQueues['/admin/queues'];

module.exports = {
  ...auth,
  ...oauth,
  ...users,
  ...blogs,
  ...systemWithoutQueues,
  ...files,
  '/admin/queues': adminQueues,
};
