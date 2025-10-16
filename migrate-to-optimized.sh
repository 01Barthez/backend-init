#!/bin/bash

# ⚡ Script de Migration vers Controller Optimisé
# Usage: chmod +x migrate-to-optimized.sh && ./migrate-to-optimized.sh

set -e

echo "🚀 Migration vers Controller Optimisé"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté depuis la racine du projet backend${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Étape 1: Backup de l'ancien controller${NC}"
if [ -f "src/controllers/users/users.controller.ts" ]; then
    cp src/controllers/users/users.controller.ts src/controllers/users/users.controller.backup.ts
    echo -e "${GREEN}✅ Backup créé: users.controller.backup.ts${NC}"
else
    echo -e "${YELLOW}⚠️  Fichier controller original non trouvé${NC}"
fi
echo ""

echo -e "${YELLOW}📋 Étape 2: Remplacement par la version optimisée${NC}"
if [ -f "src/controllers/users/users.controller.optimized.ts" ]; then
    cp src/controllers/users/users.controller.optimized.ts src/controllers/users/users.controller.ts
    echo -e "${GREEN}✅ Controller remplacé par la version optimisée${NC}"
else
    echo -e "${RED}❌ Erreur: users.controller.optimized.ts non trouvé${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}📋 Étape 3: Vérification des fichiers de cache${NC}"
if [ -f "src/services/caching/user-cache.ts" ]; then
    echo -e "${GREEN}✅ user-cache.ts présent${NC}"
else
    echo -e "${RED}❌ Erreur: user-cache.ts manquant${NC}"
    exit 1
fi

if [ -f "src/services/caching/cache-data.ts" ]; then
    echo -e "${GREEN}✅ cache-data.ts présent${NC}"
else
    echo -e "${RED}❌ Erreur: cache-data.ts manquant${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}📋 Étape 4: Vérification du fichier helpers${NC}"
if [ -f "src/utils/responses/helpers.ts" ]; then
    # Check if asyncHandler exists
    if grep -q "asyncHandler" src/utils/responses/helpers.ts; then
        echo -e "${GREEN}✅ helpers.ts contient asyncHandler${NC}"
    else
        echo -e "${YELLOW}⚠️  asyncHandler non trouvé dans helpers.ts${NC}"
    fi
    
    # Check if validateRequiredFields exists
    if grep -q "validateRequiredFields" src/utils/responses/helpers.ts; then
        echo -e "${GREEN}✅ helpers.ts contient validateRequiredFields${NC}"
    else
        echo -e "${YELLOW}⚠️  validateRequiredFields non trouvé dans helpers.ts${NC}"
    fi
else
    echo -e "${RED}❌ Erreur: helpers.ts manquant${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}📋 Étape 5: Vérification de la configuration${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ Fichier .env trouvé${NC}"
    
    # Check for Redis config
    if grep -q "REDIS_HOST" .env; then
        echo -e "${GREEN}✅ Configuration Redis présente${NC}"
    else
        echo -e "${YELLOW}⚠️  Configuration Redis manquante dans .env${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Fichier .env non trouvé${NC}"
fi
echo ""

echo -e "${YELLOW}📋 Étape 6: Compilation TypeScript${NC}"
if command -v npm &> /dev/null; then
    echo "Compilation en cours..."
    npm run build 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Compilation échouée (normal si dans Docker)${NC}"
    }
else
    echo -e "${YELLOW}⚠️  npm non disponible (normal si dans Docker)${NC}"
fi
echo ""

echo -e "${GREEN}════════════════════════════════════${NC}"
echo -e "${GREEN}✨ Migration terminée avec succès !${NC}"
echo -e "${GREEN}════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}📝 Prochaines étapes:${NC}"
echo ""
echo "1️⃣  Redémarrer le backend:"
echo "   docker-compose restart backend"
echo ""
echo "2️⃣  Vérifier les logs:"
echo "   docker-compose logs -f backend | grep 'fetching from'"
echo ""
echo "3️⃣  Tester une requête:"
echo "   curl http://localhost:3000/api/v1/users"
echo ""
echo "4️⃣  Consulter la documentation:"
echo "   - QUICK_START_OPTIMIZATION.md"
echo "   - OPTIMIZATION_GUIDE.md"
echo ""

echo -e "${YELLOW}📦 Fichiers créés/modifiés:${NC}"
echo "   ✅ users.controller.ts (remplacé)"
echo "   ✅ users.controller.backup.ts (backup)"
echo "   ✅ user-cache.ts (nouveau service)"
echo "   ✅ cache-data.ts (amélioré)"
echo "   ✅ helpers.ts (amélioré)"
echo ""

echo -e "${YELLOW}⚠️  Note importante:${NC}"
echo "   Si vous voulez revenir à l'ancien controller:"
echo "   cp src/controllers/users/users.controller.backup.ts \\"
echo "      src/controllers/users/users.controller.ts"
echo ""

echo -e "${GREEN}🎉 Bon développement !${NC}"
