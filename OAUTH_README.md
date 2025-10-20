# 🔐 OAuth2.0 Authentication System

## Vue d'ensemble

Ce backend implémente un système d'authentification OAuth2.0 complet et
professionnel avec support pour **7 providers** majeurs:

- ✅ **Google** - OAuth 2.0 avec OpenID Connect
- ✅ **GitHub** - OAuth 2.0
- ✅ **Facebook** - OAuth 2.0
- ✅ **Instagram** - Basic Display API
- ✅ **Twitter (X)** - OAuth 2.0 avec PKCE
- ✅ **LinkedIn** - OpenID Connect
- ✅ **Telegram** - Login Widget

## 🏗️ Architecture

### Structure des fichiers

```
src/
├── controllers/users/OAuth/
│   ├── oauth-authorize.ts      # Initie le flow OAuth
│   ├── oauth-callback.ts       # Gère le callback du provider
│   ├── oauth-accounts.ts       # Liste les comptes liés
│   ├── oauth-unlink.ts         # Délie un compte OAuth
│   └── telegram-auth.ts        # Authentification Telegram
│
├── services/oauth/
│   ├── base-oauth.service.ts   # Service de base abstrait
│   ├── oauth-manager.service.ts # Gestionnaire central
│   └── providers/
│       ├── google-oauth.service.ts
│       ├── github-oauth.service.ts
│       ├── facebook-oauth.service.ts
│       ├── instagram-oauth.service.ts
│       ├── twitter-oauth.service.ts
│       ├── linkedin-oauth.service.ts
│       └── telegram-oauth.service.ts
│
├── core/
│   ├── interface/oauth.interface.ts  # Types TypeScript
│   └── constant/oauth.constant.ts    # Constantes OAuth
│
└── router/users/auth.router.ts       # Routes OAuth
```

### Base de données

Le schéma Prisma a été mis à jour avec:

```prisma
model users {
  password       String? // Optionnel pour OAuth
  oauth_accounts oauth_account[]
  // ...
}

model oauth_account {
  provider              oauth_provider
  provider_user_id      String
  access_token          String?
  refresh_token         String?
  expires_at            DateTime?
  provider_profile_data Json?
  // ...
}

enum oauth_provider {
  GOOGLE | GITHUB | FACEBOOK | INSTAGRAM | TWITTER | LINKEDIN | TELEGRAM
}
```

## 🚀 Installation

### 1. Installer les dépendances

```bash
npm install
```

La dépendance `axios` a été ajoutée pour les requêtes HTTP OAuth.

### 2. Mettre à jour la base de données

```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les changements au schéma
npx prisma db push
```

### 3. Configurer les variables d'environnement

Copiez `.env.example` vers `.env` et configurez vos credentials OAuth:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/auth/oauth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:3000/api/v1/auth/oauth/github/callback

# ... (voir .env.example pour tous les providers)
```

### 4. Obtenir les credentials OAuth

Consultez le guide détaillé: [`docs/OAUTH_SETUP.md`](docs/OAUTH_SETUP.md)

## 📡 API Endpoints

### Routes publiques

#### Initier l'authentification OAuth

```http
GET /api/v1/auth/oauth/:provider
```

**Paramètres:**

- `provider`: `google`, `github`, `facebook`, `instagram`, `twitter`, `linkedin`
- `redirect_url` (query, optionnel): URL de redirection après authentification

**Exemple:**

```bash
curl "http://localhost:3000/api/v1/auth/oauth/google?redirect_url=http://localhost:5173/dashboard"
```

#### Callback OAuth (géré automatiquement)

```http
GET /api/v1/auth/oauth/:provider/callback
```

#### Authentification Telegram

```http
POST /api/v1/auth/oauth/telegram
Content-Type: application/json

{
  "id": 123456789,
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "photo_url": "https://...",
  "auth_date": 1234567890,
  "hash": "abc123..."
}
```

### Routes protégées (authentification requise)

#### Lister les comptes OAuth liés

```http
GET /api/v1/auth/oauth/accounts
Authorization: Bearer <token>
```

**Réponse:**

```json
{
  "success": true,
  "data": [
    {
      "provider": "GOOGLE",
      "provider_email": "user@gmail.com",
      "linked_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "OAuth accounts retrieved successfully"
}
```

#### Délier un compte OAuth

```http
DELETE /api/v1/auth/oauth/:provider/unlink
Authorization: Bearer <token>
```

## 🔒 Sécurité

### Mesures implémentées

1. **Protection CSRF**: Paramètre `state` avec timestamp et validation
2. **Cookies sécurisés**: httpOnly, secure, sameSite
3. **Tokens JWT**: Access token (15min) + Refresh token (7 jours)
4. **Validation des providers**: Enum strict des providers supportés
5. **Expiration des tokens**: Gestion automatique avec refresh
6. **Stockage sécurisé**: Tokens OAuth chiffrés en base de données

### Flow de sécurité

```
1. Client → Backend: GET /oauth/google
2. Backend génère state + cookie sécurisé
3. Backend → Google: Redirection avec state
4. User autorise sur Google
5. Google → Backend: Callback avec code + state
6. Backend vérifie state (CSRF protection)
7. Backend échange code contre tokens
8. Backend crée/met à jour user
9. Backend génère JWT
10. Backend → Client: Redirection avec JWT
```

## 💡 Utilisation Frontend

### React/Vue/Angular Example

```typescript
// Initier l'authentification
const loginWithGoogle = () => {
  const redirectUrl = encodeURIComponent(
    window.location.origin + '/dashboard'
  );
  window.location.href =
    `${API_URL}/auth/oauth/google?redirect_url=${redirectUrl}`;
};

// Gérer le callback
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const refreshToken = params.get('refresh_token');

  if (token) {
    // Stocker les tokens
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refreshToken);

    // Rediriger vers le dashboard
    navigate('/dashboard');
  }
}, []);

// Lister les comptes liés
const fetchLinkedAccounts = async () => {
  const response = await fetch(`${API_URL}/auth/oauth/accounts`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const data = await response.json();
  return data.data;
};

// Délier un compte
const unlinkAccount = async (provider: string) => {
  await fetch(`${API_URL}/auth/oauth/${provider}/unlink`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
};
```

### Telegram Widget Integration

```html
<!DOCTYPE html>
<html>
<head>
  <script async src="https://telegram.org/js/telegram-widget.js?22"
          data-telegram-login="your_bot_username"
          data-size="large"
          data-onauth="onTelegramAuth(user)"
          data-request-access="write">
  </script>
</head>
<body>
  <script>
    function onTelegramAuth(user) {
      fetch('http://localhost:3000/api/v1/auth/oauth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      })
      .then(res => res.json())
      .then(data => {
        // Gérer la réponse
        console.log('Authenticated:', data);
      });
    }
  </script>
</body>
</html>
```

## 🧪 Tests

### Test manuel avec cURL

```bash
# 1. Tester Google OAuth (ouvrira le navigateur)
curl -L "http://localhost:3000/api/v1/auth/oauth/google"

# 2. Après authentification, tester les comptes liés
curl -X GET "http://localhost:3000/api/v1/auth/oauth/accounts" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Délier un compte
curl -X DELETE "http://localhost:3000/api/v1/auth/oauth/google/unlink" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 Configuration avancée

### Personnaliser les scopes OAuth

Modifiez `src/core/constant/oauth.constant.ts`:

```typescript
export const OAUTH_SCOPES = {
  [OAuthProvider.GOOGLE]: [
    'openid',
    'profile',
    'email',
    // Ajoutez vos scopes personnalisés
  ],
  // ...
};
```

### Ajouter un nouveau provider

1. Créer le service dans `src/services/oauth/providers/`
2. Étendre `BaseOAuthService`
3. Implémenter `getUserProfile()`
4. Ajouter au `OAuthManager`
5. Ajouter les variables d'environnement
6. Mettre à jour l'enum `oauth_provider` dans Prisma

## 📊 Monitoring

Les logs OAuth sont automatiquement enregistrés:

```typescript
log.info('OAuth login successful', {
  provider: 'GOOGLE',
  email: 'user@example.com',
  isNewUser: false
});
```

## 🐛 Troubleshooting

### Erreur: "Invalid OAuth state parameter"

- Le cookie de state a expiré (15 min)
- Réessayez l'authentification

### Erreur: "Failed to exchange authorization code"

- Vérifiez les credentials (CLIENT_ID, CLIENT_SECRET)
- Vérifiez que le REDIRECT_URI correspond exactement

### Erreur: "Email already exists"

- Un compte existe déjà avec cet email
- L'utilisateur peut se connecter avec son mot de passe
- Ou lier le compte OAuth après connexion

## 📚 Documentation complète

- [Guide de configuration détaillé](docs/OAUTH_SETUP.md)
- [Documentation Prisma](https://www.prisma.io/docs/)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)

## 🎯 Fonctionnalités

- ✅ Multi-provider OAuth (7 providers)
- ✅ Linking/Unlinking de comptes
- ✅ Gestion automatique des tokens
- ✅ Refresh token support
- ✅ Protection CSRF
- ✅ Cookies sécurisés
- ✅ TypeScript strict
- ✅ Clean Code architecture
- ✅ Logs détaillés
- ✅ Gestion d'erreurs complète
- ✅ Documentation exhaustive

## 📝 License

MIT

---

**Développé avec ❤️ en suivant les meilleures pratiques OAuth2.0 et Clean Code**
