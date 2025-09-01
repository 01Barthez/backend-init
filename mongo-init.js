// Wait for MongoDB to be ready
sleep(5000);

// Initialize the replica set
try {
  rs.status();
  print('Replica set already initialized.');
} catch (e) {
  print('Initializing replica set...');
  rs.initiate({
    _id: 'rs0',
    members: [{ _id: 0, host: 'mongo:27017' }],
  });
}

// Switch to admin database
db = db.getSiblingDB('admin');

// Create admin user if it doesn't exist
if (!db.getUser(_getEnv('MONGO_INITDB_ROOT_USERNAME'))) {
  db.createUser({
    user: _getEnv('MONGO_INITDB_ROOT_USERNAME'),
    pwd: _getEnv('MONGO_INITDB_ROOT_PASSWORD'),
    roles: ['root'],
  });
  print('Admin user created.');
} else {
  print('Admin user already exists.');
}

// Switch to application database
db = db.getSiblingDB(_getEnv('MONGO_INITDB_DATABASE'));

// Create application user if it doesn't exist
if (!db.getUser(_getEnv('MONGO_USER'))) {
  db.createUser({
    user: _getEnv('MONGO_USER'),
    pwd: _getEnv('MONGO_PASSWORD'),
    roles: [{ role: 'readWrite', db: _getEnv('MONGO_INITDB_DATABASE') }],
  });
  print('Application user created.');
} else {
  print('Application user already exists.');
}

print('MongoDB initialization script completed.');
