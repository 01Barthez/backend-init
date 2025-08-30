#!/bin/bash
set -e

# 1. Create or verify keyfile
if [ ! -f /mongo-keyfile ]; then
    echo "Creating mongo-keyfile..."
    openssl rand -base64 756 > /mongo-keyfile
    chmod 400 /mongo-keyfile
    chown 999:999 /mongo-keyfile
fi

# 2. Start temporary MongoDB with replica set (no auth/keyfile yet)
echo "Starting temporary MongoDB with replica set..."
mongod --fork --logpath /proc/1/fd/1 --bind_ip_all --replSet rs0

# 3. Wait for MongoDB to be ready
until mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; do
    echo "Waiting for MongoDB..."
    sleep 1
done

# 4. Initiate replica set if not already done
echo "Initializing replica set..."
mongosh --eval "
  try {
    rs.status();
    print('Replica set already initialized.');
  } catch (e) {
    print('Initializing replica set...');
    rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'mongo:27017' }] });
  }
"

# 5. Wait for replica set to become primary
until mongosh --eval "rs.status().myState === 1" >/dev/null 2>&1; do
    echo "Waiting for replica set to become primary..."
    sleep 1
done

# 6. Create admin (root) user if not exists
echo "Creating admin user..."
mongosh admin --eval "
  if (!db.getUser('$MONGO_INITDB_ROOT_USERNAME')) {
    db.createUser({
      user: '$MONGO_INITDB_ROOT_USERNAME',
      pwd: '$MONGO_INITDB_ROOT_PASSWORD',
      roles: ['root']
    });
    print('Admin user created.');
  } else {
    print('Admin user already exists.');
  }
"

# 7. Create application user if not exists (readWrite on app DB)
echo "Creating application user..."
mongosh "$MONGO_INITDB_DATABASE" --eval "
  if (!db.getUser('$MONGO_INITDB_ROOT_USERNAME')) {
    db.createUser({
      user: '$MONGO_INITDB_ROOT_USERNAME',
      pwd: '$MONGO_INITDB_ROOT_PASSWORD',
      roles: [{ role: 'readWrite', db: '$MONGO_INITDB_DATABASE' }]
    });
    print('Application user created.');
  } else {
    print('Application user already exists.');
  }
"
echo "MongoDB initialization completed."

# 8. Shut down temporary instance
echo "Shutting down temporary instance..."
mongod --shutdown

# 9. Start final MongoDB with auth, replica set, and keyfile
echo "Starting MongoDB with authentication and replication..."
exec mongod --bind_ip_all --replSet rs0 --keyFile /mongo-keyfile --auth 