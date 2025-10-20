# Documentation de l'API GTA

Bienvenue dans la documentation de l'API GTA. Cette documentation est générée
avec OpenAPI (Swagger) et fournit une référence complète pour tous les points de
terminaison de l'API.

## Accès à la documentation

La documentation de l'API est disponible à l'adresse suivante :

- **Développement local** : http://localhost:3000/api-docs
- **Staging** : https://api.staging.gtamarket.com/api-docs
- **Production** : https://api.gtamarket.com/api-docs

## Authentification

La plupart des endpoints de l'API nécessitent une authentification. Voici
comment s'authentifier :

1. **Authentification JWT**
   - Obtenez un jeton JWT en vous connectant via `/auth/login`
   - Utilisez le jeton dans l'en-tête `Authorization: Bearer <token>`

2. **OAuth 2.0**
   - Plusieurs fournisseurs sont pris en charge (Google, GitHub, etc.)
   - Voir la section OAuth pour plus de détails

## Sections de la documentation

### Authentification

- Connexion/déconnexion
- Rafraîchissement des jetons
- Gestion des sessions

### Utilisateurs

- Création de compte
- Profil utilisateur
- Gestion des rôles (admin)

### Articles (Blogs)

- Liste des articles
- Détails d'un article
- Création/édition (admin/auteurs)

### Articles (Items)

- Gestion des produits
- Catégories et étiquettes
- Recherche et filtrage

### Système

- Vérification de l'état de l'API
- Sécurité (CSP, CSRF)
- Métriques

## Bonnes pratiques

1. **Gestion des erreurs**
   - Toutes les erreurs suivent un format standard
   - Les codes d'état HTTP sont utilisés de manière appropriée

2. **Pagination**
   - Les listes sont paginées par défaut
   - Utilisez les paramètres `page` et `limit` pour la navigation

3. **Taux de requêtes**
   - Limite de 100 requêtes par minute par adresse IP
   - Les en-têtes de réponse incluent les limites actuelles

## Exemples de requêtes

### Connexion

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "votre-mot-de-passe"
}
```

### Création d'un article

```http
POST /blogs
Authorization: Bearer votre-jeton
Content-Type: application/json

{
  "title": "Nouvel article",
  "content": "Contenu de l'article...",
  "categories": ["Technologie"],
  "tags": ["nodejs", "api"]
}
```

## Support

Pour toute question ou problème, veuillez contacter :

- Email : support@gtamarket.com
- Site web : https://gtamarket.com/support

---

© 2023 GTA Market. Tous droits réservés.
