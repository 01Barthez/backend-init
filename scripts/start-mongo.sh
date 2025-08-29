#!/bin/bash
set -e

# 1. Configuration du fichier de clé
if [ ! -f /mongo-keyfile ]; then
    echo "Création du fichier mongo-keyfile..."
    openssl rand -base64 756 > /mongo-keyfile
    chmod 400 /mongo-keyfile
    chown 999:999 /mongo-keyfile
else
    chmod 400 /mongo-keyfile
    chown 999:999 /mongo-keyfile
fi

# 2. Démarrer MongoDB temporairement sans authentification
echo "Démarrage de MongoDB sans authentification..."
mongod --fork --logpath /proc/1/fd/1 --bind_ip_all

# 3. Attendre que MongoDB soit prêt
echo "En attente du démarrage de MongoDB..."
until mongo --eval "db.adminCommand('ping')" 2>/dev/null; do
    echo "En attente de MongoDB..."
    sleep 1
done

# 4. Créer l'utilisateur admin
echo "Création de l'utilisateur admin..."
mongo admin --eval "
    db.getSiblingDB('admin').createUser({
        user: '$MONGO_INITDB_ROOT_USERNAME',
        pwd: '$MONGO_INITDB_ROOT_PASSWORD',
        roles: ['root']
    })"

# 5. Arrêter l'instance temporaire
echo "Arrêt de l'instance temporaire..."
mongod --shutdown

# 6. Démarrer MongoDB avec l'authentification et la réplication
echo "Démarrage de MongoDB avec authentification et réplication..."
exec mongod --bind_ip_all --replSet rs0 --keyFile /mongo-keyfile --auth

echo "MongoDB est prêt !"

# Garder le conteneur en vie
tail -f /dev/null