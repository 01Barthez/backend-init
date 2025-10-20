# OAuth2.0 Setup Guide

This guide explains how to configure OAuth2.0 authentication for all supported
providers.

## Supported Providers

- ✅ Google
- ✅ GitHub
- ✅ Facebook
- ✅ Instagram
- ✅ Twitter (X)
- ✅ LinkedIn
- ✅ Telegram

## Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Client    │─────▶│  Backend API │─────▶│  OAuth      │
│ Application │      │   (Express)  │      │  Provider   │
└─────────────┘      └──────────────┘      └─────────────┘
       ▲                     │                      │
       │                     │                      │
       └─────────────────────┴──────────────────────┘
              Callback with tokens
```

## Database Schema

The OAuth implementation uses two main models:

### `users` Model

- `password` is now optional (for OAuth-only users)
- Has relation to `oauth_accounts`

### `oauth_account` Model

- Stores OAuth provider information
- Stores access/refresh tokens
- Links to user account
- Supports multiple providers per user

## API Endpoints

### Public Endpoints

#### Initiate OAuth Flow

```http
GET /api/v1/auth/oauth/:provider
```

Supported providers: `google`, `github`, `facebook`, `instagram`, `twitter`,
`linkedin`

Query Parameters:

- `redirect_url` (optional): URL to redirect after successful authentication

Example:

```bash
curl -X GET "http://localhost:3000/api/v1/auth/oauth/google?redirect_url=http://localhost:5173/dashboard"
```

#### OAuth Callback

```http
GET /api/v1/auth/oauth/:provider/callback
```

This endpoint is called by the OAuth provider after user authorization.

#### Telegram Authentication

```http
POST /api/v1/auth/oauth/telegram
```

Body:

```json
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

### Protected Endpoints (Require Authentication)

#### Get Linked OAuth Accounts

```http
GET /api/v1/auth/oauth/accounts
Authorization: Bearer <token>
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "provider": "GOOGLE",
      "provider_email": "user@gmail.com",
      "linked_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Unlink OAuth Account

```http
DELETE /api/v1/auth/oauth/:provider/unlink
Authorization: Bearer <token>
```

## Provider Setup Instructions

### 1. Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen
6. Add authorized redirect URI:
   `http://localhost:3000/api/v1/auth/oauth/google/callback`
7. Copy Client ID and Client Secret

**.env Configuration:**

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/auth/oauth/google/callback
```

### 2. GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in application details
4. Authorization callback URL:
   `http://localhost:3000/api/v1/auth/oauth/github/callback`
5. Copy Client ID and generate Client Secret

**.env Configuration:**

```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:3000/api/v1/auth/oauth/github/callback
```

### 3. Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add **Facebook Login** product
4. Configure OAuth redirect URIs:
   `http://localhost:3000/api/v1/auth/oauth/facebook/callback`
5. Copy App ID and App Secret

**.env Configuration:**

```env
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/v1/auth/oauth/facebook/callback
```

### 4. Instagram OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app with Instagram Basic Display
3. Add Instagram Basic Display product
4. Configure redirect URI:
   `http://localhost:3000/api/v1/auth/oauth/instagram/callback`
5. Copy Instagram App ID and App Secret

**.env Configuration:**

```env
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/v1/auth/oauth/instagram/callback
```

**Note:** Instagram Basic Display API has limited access and doesn't provide
email.

### 5. Twitter (X) OAuth 2.0

1. Go to
   [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project and app
3. Enable OAuth 2.0
4. Add callback URL: `http://localhost:3000/api/v1/auth/oauth/twitter/callback`
5. Copy Client ID and Client Secret

**.env Configuration:**

```env
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
TWITTER_REDIRECT_URI=http://localhost:3000/api/v1/auth/oauth/twitter/callback
```

### 6. LinkedIn OAuth

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Add **Sign In with LinkedIn using OpenID Connect** product
4. Add redirect URL: `http://localhost:3000/api/v1/auth/oauth/linkedin/callback`
5. Copy Client ID and Client Secret

**.env Configuration:**

```env
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/v1/auth/oauth/linkedin/callback
```

### 7. Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow instructions to create bot
4. Copy the bot token
5. Send `/setdomain` to configure domain for Login Widget

**.env Configuration:**

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_BOT_USERNAME=your_bot_username
```

**Frontend Integration:**

```html
<script async src="https://telegram.org/js/telegram-widget.js?22"
        data-telegram-login="your_bot_username"
        data-size="large"
        data-onauth="onTelegramAuth(user)"
        data-request-access="write">
</script>

<script>
function onTelegramAuth(user) {
  fetch('/api/v1/auth/oauth/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
}
</script>
```

## Testing OAuth Flow

### Using cURL

```bash
# 1. Get authorization URL (will redirect)
curl -L "http://localhost:3000/api/v1/auth/oauth/google"

# 2. After callback, you'll receive JWT tokens in cookies/headers

# 3. Check linked accounts
curl -X GET "http://localhost:3000/api/v1/auth/oauth/accounts" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 4. Unlink provider
curl -X DELETE "http://localhost:3000/api/v1/auth/oauth/google/unlink" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Frontend Integration Example

```javascript
// Initiate OAuth flow
const loginWithGoogle = () => {
  const redirectUrl = encodeURIComponent(window.location.origin + '/dashboard');
  window.location.href = `http://localhost:3000/api/v1/auth/oauth/google?redirect_url=${redirectUrl}`;
};

// Handle callback (tokens will be in URL or cookies)
const handleOAuthCallback = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const refreshToken = params.get('refresh_token');

  if (token) {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    // Redirect to dashboard
  }
};
```

## Security Considerations

1. **State Parameter**: Used for CSRF protection (automatically handled)
2. **Secure Cookies**: Tokens stored in httpOnly, secure cookies
3. **Token Expiration**: Access tokens expire, refresh tokens for renewal
4. **HTTPS Required**: Use HTTPS in production
5. **Scope Limitation**: Request only necessary permissions

## Troubleshooting

### Common Issues

**1. Redirect URI Mismatch**

- Ensure redirect URI in provider settings matches exactly
- Check for trailing slashes
- Verify protocol (http vs https)

**2. Invalid Client ID/Secret**

- Double-check credentials in .env file
- Ensure no extra spaces or quotes

**3. Email Not Provided**

- Some providers (Instagram, Twitter) don't provide email
- App handles this by generating placeholder email

**4. Token Expired**

- Implement token refresh logic
- Use refresh tokens to get new access tokens

## Production Deployment

1. Update all redirect URIs to production domain
2. Enable HTTPS
3. Set secure cookie flags
4. Configure CORS properly
5. Add rate limiting
6. Monitor OAuth provider quotas

## Database Migration

After updating the schema, run:

```bash
npx prisma generate
npx prisma db push
```

## Additional Resources

- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
- [OpenID Connect](https://openid.net/connect/)
- [Provider Documentation Links](#provider-setup-instructions)
