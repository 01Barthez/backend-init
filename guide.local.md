# Guide local Postman — Backend Init

Fichier **local** (gitignored). Base URL assume Docker up sur le port `3000`.

```
Base URL API  : http://localhost:3000
Préfixe       : /api/v1
MailHog UI    : http://localhost:8025
Swagger UI    : http://localhost:3000/api-docs
MinIO console : http://localhost:9001  (si exposé)
```

> CSRF : dans ton `.env`, `ALLOW_CSRF_PROTECTION=false` → pas besoin de header CSRF pour Postman.
> Si tu le réactives plus tard : `GET /csrf-token` puis header `X-XSRF-TOKEN`.

---

## 0. Accéder à Swagger (`/api-docs`)

Swagger n’est **pas** public : HTTP **Basic Auth** (middleware `adminBasicAuth`).

Chez toi aujourd’hui :

| Variable | Valeur utile |
|----------|----------------|
| User | `SWAGGER_USER` (souvent `admin`) |
| Password | `SWAGGER_PASSWORD` (dans ton `.env`) |
| Fallback | `ADMIN_BASIC_PASSWORD` est **vide** → le serveur utilise `SWAGGER_PASSWORD` |

### Navigateur

1. Ouvre `http://localhost:3000/api-docs`
2. Une popup Basic Auth apparaît
3. User / password = ceux de `.env` (`SWAGGER_USER` / `SWAGGER_PASSWORD`)
4. Si rien ne s’affiche : `SWAGGER_ENABLED=true` et backend healthy (`GET /health`)

### Postman (Swagger JSON)

- `GET http://localhost:3000/api-docs.json`
- Auth type : **Basic Auth** → mêmes credentials

### Bull Board (queues)

- URL : `http://localhost:3000/admin/queues`
- Basic Auth **puis** Bearer JWT d’un user `admin` ou `super-admin`

### Metrics

- `GET http://localhost:3000/metrics` → Basic Auth uniquement (pas de JWT)

---

## 1. Setup Postman (une fois)

### Environment variables Postman

| Variable | Exemple |
|----------|---------|
| `baseUrl` | `http://localhost:3000` |
| `api` | `{{baseUrl}}/api/v1` |
| `accessToken` | *(vide au départ)* |
| `refreshToken` | *(vide au départ)* |
| `userId` | *(vide)* |
| `familyId` | *(vide)* |
| `blogId` | *(vide)* |
| `blogSlug` | *(vide)* |

### Auth Bearer

Sur la collection (ou chaque folder protégé) :

- Type : **Bearer Token**
- Token : `{{accessToken}}`

### Cookie / refresh (important)

Ton `.env` a `COOKIE_SECURE=true`. Sur **HTTP** localhost, le navigateur/Postman **peut refuser** le cookie refresh.

Deux options :

1. **Recommandé pour tests locaux** : mettre `COOKIE_SECURE=false` dans `.env`, restart backend, laisser Postman gérer les cookies.
2. Ou récupérer le refresh depuis le Set-Cookie / body si exposé, et appeler refresh avec JSON :

```json
{ "refreshToken": "{{refreshToken}}" }
```

### Récupérer le access token après login

Le login met le token dans le **header de réponse** `Authorization: Bearer …` (pas seulement le body).

Dans Tests Postman du login :

```js
const auth = pm.response.headers.get('Authorization');
if (auth && auth.startsWith('Bearer ')) {
  pm.environment.set('accessToken', auth.slice(7));
}
const json = pm.response.json();
if (json?.data?.id) pm.environment.set('userId', json.data.id);
```

---

## 2. Parcours de test recommandé (ordre)

Fais les étapes **dans l’ordre**. Chaque bloc indique auth + body minimal.

### Étape A — System (sans token)

| # | Method | URL | Auth | Attendu | À quoi ça sert |
|---|--------|-----|------|---------|----------------|
| A1 | GET | `{{baseUrl}}/health` | none | 200 | Ready : Mongo + Redis |
| A2 | GET | `{{baseUrl}}/health/live` | none | 200 | Process vivant (pas de deps) |
| A3 | GET | `{{baseUrl}}/health/ready` | none | 200 | Même sémantique que `/health` |
| A4 | GET | `{{baseUrl}}/csrf-token` | none | 200 | Token CSRF (ou `csrfEnabled:false`) |
| A5 | GET | `{{baseUrl}}/metrics` | none | **401** | Prometheus protégé |
| A6 | GET | `{{baseUrl}}/metrics` | Basic `SWAGGER_*` | 200 | Texte Prometheus |
| A7 | POST | `{{baseUrl}}/security/csp-violation` | none | **204** | Rapport CSP navigateur |
| A8 | GET | `{{baseUrl}}/api-docs` | Basic | 200 HTML | UI Swagger |

Body A7 (Content-Type `application/csp-report`) :

```json
{
  "csp-report": {
    "blocked-uri": "https://evil.example",
    "violated-directive": "script-src"
  }
}
```

---

### Étape B — Auth cycle complet (user normal)

| # | Method | URL | Auth | Body / notes | Attendu |
|---|--------|-----|------|--------------|---------|
| B1 | POST | `{{api}}/auth/signup` | none | JSON ci-dessous (ou multipart + file `profile`) | **201** |
| B2 | — | MailHog `http://localhost:8025` | — | Ouvre le mail OTP | code 4–8 digits |
| B3 | POST | `{{api}}/auth/verify` | none | `{ "email", "otp" }` | **200** |
| B4 | POST | `{{api}}/auth/login` | none | `{ "email", "password" }` | **200** + header `Authorization` |
| B5 | GET | `{{api}}/auth/me` | Bearer | — | **200** profil + roles/permissions |
| B6 | GET | `{{api}}/auth/sessions` | Bearer | — | **200** liste `familyId` |
| B7 | POST | `{{api}}/auth/refresh` | cookie ou body | optionnel `{ "refreshToken" }` | **200** nouveau access |
| B8 | POST | `{{api}}/auth/change-password` | Bearer | `{ "current_password", "new_password" }` | **200** (révoke sessions) |
| B9 | POST | `{{api}}/auth/login` | none | nouveau password | **200** |
| B10 | POST | `{{api}}/auth/forgot-password` | none | `{ "email" }` | **200** (même si email inconnu) |
| B11 | — | MailHog | — | lien / token reset | — |
| B12 | POST | `{{api}}/auth/reset-password` | none | `{ "resetToken", "new_password" }` | **200** |
| B13 | POST | `{{api}}/auth/resend-otp` | none | `{ "email" }` (compte non vérifié) | **200** |
| B14 | POST | `{{api}}/auth/logout` | Bearer | — | **200** |

**Signup body (JSON) :**

```json
{
  "email": "postman.user@example.com",
  "password": "TestPassw0rd!234",
  "firstName": "Postman",
  "lastName": "User",
  "phone": "+15550001111"
}
```

**Verify :**

```json
{
  "email": "postman.user@example.com",
  "otp": "123456"
}
```

---

### Étape C — TOTP + recovery

| # | Method | URL | Auth | Notes | Attendu |
|---|--------|-----|------|-------|---------|
| C1 | POST | `{{api}}/auth/totp/enroll` | Bearer | Retourne `otpauthUrl` + `secret` **une fois** | **200** |
| C2 | — | App authenticator / `otplib` | — | Génère un code 6 digits | — |
| C3 | POST | `{{api}}/auth/totp/confirm` | Bearer | `{ "totpCode": "123456" }` | **200** |
| C4 | POST | `{{api}}/auth/totp/recovery-codes` | Bearer | 8 codes affichés **une fois** | **200** |
| C5 | POST | `{{api}}/auth/login` | none | **sans** `totpCode` | **≠ 200** (TOTP requis) |
| C6 | POST | `{{api}}/auth/login` | none | `{ email, password, totpCode }` | **200** |
| C7 | POST | `{{api}}/auth/totp/recover` | none | `{ email, password, recoveryCode }` (10 hex) | **200** |
| C8 | POST | `{{api}}/auth/totp/disable` | Bearer | `{ "totpCode", "current_password" }` | **200** |

---

### Étape D — Sessions

| # | Method | URL | Auth | Attendu |
|---|--------|-----|------|---------|
| D1 | GET | `{{api}}/auth/sessions` | Bearer | 200 → copie un `familyId` |
| D2 | DELETE | `{{api}}/auth/sessions/{{familyId}}` | Bearer | 200 |

---

### Étape E — Users self-service

| # | Method | URL | Auth | Body | Attendu |
|---|--------|-----|------|------|---------|
| E1 | PUT | `{{api}}/users/profile` | Bearer | JSON ou multipart `profile` | 200 |
| E2 | DELETE | `{{api}}/users/profile/avatar` | Bearer | — | 200 |
| E3 | DELETE | `{{api}}/users/me` | Bearer | soft-delete **ton** compte | 200 |

> Ne fais **E3** qu’avec un compte jetable. Après soft-delete, login doit échouer (inactif / deleted).

**Profile JSON :**

```json
{
  "firstName": "Postman2",
  "lastName": "User2",
  "phone": "+15550002222"
}
```

---

### Étape F — OAuth (manuel / navigateur)

Ces routes ne se testent pas bien en Postman pur (redirects).

| Method | URL | Auth | Rôle |
|--------|-----|------|------|
| GET | `{{api}}/auth/oauth/accounts` | Bearer | Liste providers liés |
| GET | `{{api}}/auth/oauth/{provider}` | none | Redirect vers Google/GitHub/… (`provider` ∈ google, github, facebook, instagram*, twitter, linkedin) |
| GET | `{{api}}/auth/oauth/{provider}/callback` | none | Callback OAuth (navigateur) |
| POST | `{{api}}/auth/oauth/telegram` | none | Widget Telegram (payload signé) |
| DELETE | `{{api}}/auth/oauth/{provider}/unlink` | Bearer | Unlink self |

\* Instagram = deprecated (Basic Display API morte).

Prérequis : `*_CLIENT_ID` / secrets renseignés dans `.env`, sinon le provider est inactif.

---

### Étape G — Admin users (besoin d’un compte admin)

Le signup donne le rôle **`user`**. Pour tester l’admin :

1. Soit seed / DB : assigner `admin` ou `super-admin` à ton user  
2. Soit `PUT {{api}}/users/{{userId}}/role` **depuis un compte déjà admin**

Permissions utiles :

| Permission | Endpoints typiques |
|------------|-------------------|
| `user:read:any` | list, search, get, sessions |
| `user:update:any` | invite, patch, activate/deactivate, verify, unlock, revoke-sessions, restore, admin unlink OAuth |
| `user:role:assign` | PUT role |
| `user:export` | CSV export |
| `user:delete:any` | soft + permanent delete |
| `audit:read` | GET audit |

| # | Method | URL | Permission | Attendu |
|---|--------|-----|------------|---------|
| G1 | GET | `{{api}}/users?page=1&limit=10` | `user:read:any` | 200 |
| G2 | GET | `{{api}}/users/search?search=postman` | `user:read:any` | 200 |
| G3 | GET | `{{api}}/users/export` | `user:export` | 200 CSV |
| G4 | POST | `{{api}}/users/invite` | `user:update:any` | 201 |
| G5 | GET | `{{api}}/users/{{userId}}` | `user:read:any` | 200 |
| G6 | GET | `{{api}}/users/{{userId}}/sessions` | `user:read:any` | 200 |
| G7 | PATCH | `{{api}}/users/{{userId}}` | `user:update:any` | 200 |
| G8 | PUT | `{{api}}/users/{{userId}}/role` | `user:role:assign` | 200 |
| G9 | POST | `{{api}}/users/{{userId}}/deactivate` | `user:update:any` | 200 |
| G10 | POST | `{{api}}/users/{{userId}}/activate` | `user:update:any` | 200 |
| G11 | POST | `{{api}}/users/{{userId}}/verify-email` | `user:update:any` | 200 |
| G12 | POST | `{{api}}/users/{{userId}}/unlock` | `user:update:any` | 200 |
| G13 | POST | `{{api}}/users/{{userId}}/revoke-sessions` | `user:update:any` | 200 |
| G14 | DELETE | `{{api}}/users/{{userId}}` | `user:delete:any` | 200 soft |
| G15 | POST | `{{api}}/users/{{userId}}/restore` | `user:update:any` | 200 |
| G16 | DELETE | `{{api}}/users/{{userId}}/permanent` | `user:delete:any` | 200 hard (irréversible) |
| G17 | DELETE | `{{api}}/users/{{userId}}/oauth/google` | `user:update:any` | 200 |

**Invite body :**

```json
{
  "email": "invited@example.com",
  "firstName": "Invited",
  "lastName": "User",
  "phone": "+15550003333",
  "role": "user"
}
```

**Role body :**

```json
{ "role": "admin" }
```

Rôles assignables via API : `admin` | `user` | `guest` (pas `super-admin`).

---

### Étape H — Blogs

| # | Method | URL | Auth / perm | Attendu |
|---|--------|-----|-------------|---------|
| H1 | GET | `{{api}}/blogs` | public | 200 |
| H2 | GET | `{{api}}/blogs/search?q=hello` | public | 200 |
| H3 | POST | `{{api}}/blogs` | Bearer + `blog:create` | 201 |
| H4 | GET | `{{api}}/blogs/{{blogSlug}}` | public | 200 |
| H5 | PUT | `{{api}}/blogs/{{blogId}}` | Bearer + `blog:update:own` (ou `:any`) | 200 |
| H6 | PATCH | `{{api}}/blogs/{{blogId}}/publish` | Bearer + `blog:publish` | 200 |
| H7 | DELETE | `{{api}}/blogs/{{blogId}}` | Bearer + `blog:delete:own` (ou `:any`) | 200 |

**Create :**

```json
{
  "title": "Mon premier post",
  "content": "Contenu de test Postman",
  "excerpt": "extrait"
}
```

Rôle `user` a déjà create / update:own / delete:own / publish.

---

### Étape I — Files

| # | Method | URL | Auth | Body | Attendu |
|---|--------|-----|------|------|---------|
| I1 | POST | `{{api}}/files/presign` | Bearer | JSON ci-dessous | 200 URL PUT |
| I2 | GET | `{{api}}/files/presign?key=...` | Bearer | query `key` | 200 URL GET |

```json
{
  "filename": "avatar.png",
  "contentType": "image/png",
  "size": 1024
}
```

MIME autorisés typiques : `image/jpeg`, `image/png`, `application/pdf` (pas `text/plain`).

---

### Étape J — Audit admin

| # | Method | URL | Auth | Attendu |
|---|--------|-----|------|---------|
| J1 | GET | `{{api}}/admin/audit?page=1&limit=20` | Bearer + `audit:read` | 200 |

---

## 3. Catalogue complet des endpoints

Légende auth : `public` | `Bearer` | `Basic` | `Basic+Bearer admin`

### System / ops (hors `/api/v1`)

| Method | Path | Auth | Rôle |
|--------|------|------|------|
| GET | `/health` | public | Ready Mongo+Redis |
| GET | `/health/live` | public | Liveness |
| GET | `/health/ready` | public | Readiness |
| GET | `/csrf-token` | public | CSRF JSON |
| GET | `/metrics` | Basic | Prometheus |
| POST | `/security/csp-violation` | public | CSP report → 204 |
| GET | `/security/csp-violation` | public | Legacy CSP |
| GET | `/api-docs` | Basic | Swagger UI |
| GET | `/api-docs.json` | Basic | OpenAPI JSON |
| * | `/admin/queues` (+ sous-routes) | Basic + Bearer admin | Bull Board |

### Auth — `/api/v1/auth`

| Method | Path | Auth | Rôle |
|--------|------|------|------|
| POST | `/signup` | public | Inscription + OTP mail |
| POST | `/verify` | public | Valider OTP email |
| POST | `/resend-otp` | public | Renvoyer OTP |
| POST | `/login` | public | JWT access (header) + refresh cookie |
| POST | `/refresh` | public (cookie/body) | Nouveau access |
| POST | `/forgot-password` | public | Email reset |
| POST | `/reset-password` | public | Nouveau mdp via token |
| POST | `/logout` | Bearer (+ verified) | Révoque session |
| POST | `/change-password` | Bearer + active | Change mdp + revoke all |
| GET | `/me` | Bearer | Profil courant |
| GET | `/sessions` | Bearer + active | Familles refresh |
| DELETE | `/sessions/:familyId` | Bearer + active | Révoque un device |
| POST | `/totp/enroll` | Bearer + active | Démarre TOTP |
| POST | `/totp/confirm` | Bearer + active | Active TOTP |
| POST | `/totp/disable` | Bearer + active | Désactive TOTP |
| POST | `/totp/recovery-codes` | Bearer + active | Génère 8 codes |
| POST | `/totp/recover` | public | Login via recovery code |

### OAuth — `/api/v1/auth/oauth`

| Method | Path | Auth | Rôle |
|--------|------|------|------|
| GET | `/accounts` | Bearer + active | Comptes liés |
| POST | `/telegram` | public | Auth widget Telegram |
| GET | `/:provider` | public | Redirect OAuth |
| GET | `/:provider/callback` | public | Callback |
| DELETE | `/:provider/unlink` | Bearer + active | Unlink self |

### Users — `/api/v1/users`

| Method | Path | Auth / permission | Rôle |
|--------|------|-------------------|------|
| PUT | `/profile` | Bearer + active | Update self |
| DELETE | `/profile/avatar` | Bearer + active | Clear avatar |
| DELETE | `/me` | Bearer + active | Soft-delete self |
| POST | `/invite` | `user:update:any` | Invite |
| GET | `/search` | `user:read:any` | Search |
| GET | `/` | `user:read:any` | List |
| GET | `/export` | `user:export` | CSV |
| GET | `/:userId` | `user:read:any` | Detail |
| GET | `/:userId/sessions` | `user:read:any` | Sessions admin |
| PATCH | `/:userId` | `user:update:any` | Update admin |
| PUT | `/:userId/role` | `user:role:assign` | Role |
| POST | `/:userId/activate` | `user:update:any` | Activate |
| POST | `/:userId/deactivate` | `user:update:any` | Deactivate |
| POST | `/:userId/verify-email` | `user:update:any` | Force verify |
| POST | `/:userId/unlock` | `user:update:any` | Unlock |
| POST | `/:userId/revoke-sessions` | `user:update:any` | Kill sessions |
| DELETE | `/:userId` | `user:delete:any` | Soft delete |
| DELETE | `/:userId/permanent` | `user:delete:any` | Hard delete |
| POST | `/:userId/restore` | `user:update:any` | Restore |
| DELETE | `/:userId/oauth/:provider` | `user:update:any` | Admin unlink OAuth |

### Blogs — `/api/v1/blogs`

| Method | Path | Auth / permission | Rôle |
|--------|------|-------------------|------|
| GET | `/search` | public | Search |
| GET | `/` | public | List |
| GET | `/:slug` | public | By slug |
| POST | `/` | `blog:create` | Create |
| PUT | `/:id` | `blog:update:own` (+ `:any` OK) | Update |
| PATCH | `/:id/publish` | `blog:publish` | Publish |
| DELETE | `/:id` | `blog:delete:own` (+ `:any` OK) | Delete |

### Files — `/api/v1/files`

| Method | Path | Auth | Rôle |
|--------|------|------|------|
| POST | `/presign` | Bearer + active | URL upload MinIO |
| GET | `/presign` | Bearer + active | URL download |

### Audit — `/api/v1/admin/audit`

| Method | Path | Auth | Rôle |
|--------|------|------|------|
| GET | `/` | `audit:read` | Liste audit |

---

## 4. Checklist rapide “tout est vert”

- [ ] A1–A8 system + Swagger Basic
- [ ] B1–B7 signup → OTP MailHog → login → me → sessions → refresh
- [ ] C1–C7 TOTP + recovery
- [ ] E1 profile
- [ ] H1–H7 blogs avec user
- [ ] I1 files png/jpeg
- [ ] Promouvoir un user en `admin` puis G1–G13 + J1
- [ ] Logout B14

---

## 5. Pièges fréquents

| Symptôme | Cause probable |
|----------|----------------|
| Popup auth sur `/api-docs` | Normal → Basic `SWAGGER_USER` / `SWAGGER_PASSWORD` |
| 401 sur routes Bearer | Header `Authorization: Bearer …` manquant / token expiré → refresh |
| Refresh ne marche pas | `COOKIE_SECURE=true` sur HTTP → `COOKIE_SECURE=false` en local |
| 403 Missing permission | Rôle `user` sur route admin |
| 403 Account not verified | Skip `POST /auth/verify` |
| OTP introuvable | MailHog `:8025` ; worker mail down |
| Signup 429 | Rate limit auth → attendre ou clear Redis `rl:auth:*` |
| Presign 400 `mime_not_allowed` | Utiliser `image/png` / `image/jpeg` / `application/pdf` |
| Nginx 404 `/api-docs` | Swagger n’est **pas** publié via Nginx public → taper `:3000` directement |

---

## 6. Promouvoir un user admin (Mongo rapide)

Si tu n’as pas encore d’admin HTTP :

```bash
# Exemple : via mongosh dans le container (adapte email)
docker exec -it BACKEND_DB mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin
```

Ou plus simple pour un template local : utiliser Prisma Studio (`npm run docker:tools` / prisma studio), trouver le `User` + `Role` slug `admin`, créer un `UserRole`.

Après assignation : **re-login** (permissions rechargées à chaque requête, mais ton token Postman doit être d’un user qui a bien le rôle).

---

*Fin du guide local. Mettre à jour ce fichier si on ajoute des routes.*
