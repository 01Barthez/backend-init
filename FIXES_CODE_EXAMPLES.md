# Code Fixes for Critical Issues

## Issue 1: Re-enable Auth Middleware on Protected Routes

**File**: `src/router/users/users.router.ts`

### Current (VULNERABLE):
```typescript
// Export users to CSV
users.get(
  '/export',
  // isAuthenticated,    // ← COMMENTED OUT
  // isAdmin,           // ← COMMENTED OUT
  users_controller.export_users,
);

// Get One User
users.get(
  '/:user_id',
  // isAuthenticated,    // ← COMMENTED OUT
  validate_user.get_user_by_id,
  validationErrorHandler,
  users_controller.get_user_by_id,
);

// Update user role
users.put(
  '/:user_id/role',
  // isAuthenticated,    // ← COMMENTED OUT
  // isAdmin,           // ← COMMENTED OUT
  validate_user.updateUserRole,
  validationErrorHandler,
  users_controller.update_user_role,
);

// Delete user (soft delete)
users.delete(
  '/:user_id',
  // isAuthenticated,    // ← COMMENTED OUT
  // isAdmin,           // ← COMMENTED OUT
  // ... rest of middleware
);
```

### Fixed:
```typescript
// Export users to CSV
users.get(
  '/export',
  isAuthenticated,    // ✅ RESTORED
  isAdmin,           // ✅ RESTORED
  users_controller.export_users,
);

// Get One User
users.get(
  '/:user_id',
  isAuthenticated,    // ✅ RESTORED
  validate_user.get_user_by_id,
  validationErrorHandler,
  users_controller.get_user_by_id,
);

// Update user role
users.put(
  '/:user_id/role',
  isAuthenticated,    // ✅ RESTORED
  isAdmin,           // ✅ RESTORED
  validate_user.updateUserRole,
  validationErrorHandler,
  users_controller.update_user_role,
);

// Delete user (soft delete)
users.delete(
  '/:user_id',
  isAuthenticated,    // ✅ RESTORED
  isAdmin,           // ✅ RESTORED
  // ... rest of middleware
);

// Clear all users (dangerous)
users.delete(
  '/clear',
  isAuthenticated,    // ✅ ADD
  isAdmin,           // ✅ ADD
  users_controller.clear_all_users,
);

// Restore deleted user
users.put(
  '/:user_id/restore',
  isAuthenticated,    // ✅ ADD
  isAdmin,           // ✅ ADD
  users_controller.restore_deleted_user,
);

// Permanently delete user
users.delete(
  '/:user_id/permanent',
  isAuthenticated,    // ✅ ADD
  isAdmin,           // ✅ ADD
  users_controller.delete_user_permanently,
);
```

---

## Issue 2: Add Missing Database Indexes

**File**: `prisma/schema.prisma`

### Current (SLOW):
```prisma
model oauth_account {
  id String @id @default(auto()) @map("_id") @db.ObjectId

  // --- User relation ---
  user_id String @db.ObjectId
  user    users  @relation(fields: [user_id], references: [user_id], onDelete: Cascade)

  // --- Provider information ---
  provider         oauth_provider
  provider_user_id String
  provider_email   String?

  // ... other fields ...

  @@unique([provider, provider_user_id])
  @@unique([user_id, provider])
  // ❌ MISSING: @@index([user_id]) - needed for user lookups
  // ❌ MISSING: @@index([provider]) - needed for provider queries
}

model blog {
  blog_id     String  @id @default(auto()) @map("_id") @db.ObjectId
  
  // ... fields ...
  
  authorId String @db.ObjectId
  author   users  @relation(fields: [authorId], references: [user_id])

  // ... other fields ...
  
  @@index([status])
  @@index([created_at, published_at])
  // ❌ MISSING: @@index([authorId]) - for user's blogs lookup
  // ❌ MISSING: @@index([visibility]) - for filtering public/private
  // ❌ MISSING: @@index([deleted_at]) - for soft-delete queries
}

model users {
  user_id    String  @id @default(auto()) @map("_id") @db.ObjectId
  email      String  @unique
  password   String?
  first_name String
  last_name  String
  
  // ... other fields ...
  
  role String @default("USER")
  is_active Boolean @default(false)
  created_at DateTime @default(now())

  // ... other fields ...

  @@index([email, is_verified])
  @@index([email, deleted_at])
  // ❌ MISSING: @@index([role]) - for admin queries
  // ❌ MISSING: @@index([is_active]) - for session queries
  // ❌ MISSING: @@index([created_at]) - for pagination/sorting
}

model blacklist {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  token      String   @unique
  created_at DateTime @default(now())
  expire_at  DateTime

  @@index([token, expire_at])
  @@index([expire_at])
  // ✅ GOOD - but could add TTL index if MongoDB supports it
}
```

### Fixed (FAST):
```prisma
model oauth_account {
  id String @id @default(auto()) @map("_id") @db.ObjectId

  // --- User relation ---
  user_id String @db.ObjectId
  user    users  @relation(fields: [user_id], references: [user_id], onDelete: Cascade)

  // --- Provider information ---
  provider         oauth_provider
  provider_user_id String
  provider_email   String?

  // ... other fields ...

  @@unique([provider, provider_user_id])
  @@unique([user_id, provider])
  @@index([user_id])           // ✅ ADDED - for user lookups
  @@index([provider])          // ✅ ADDED - for provider queries
  @@index([created_at])        // ✅ ADDED - for sorting
}

model blog {
  blog_id     String  @id @default(auto()) @map("_id") @db.ObjectId
  
  // ... fields ...
  
  authorId String @db.ObjectId
  author   users  @relation(fields: [authorId], references: [user_id])

  // ... other fields ...
  
  @@index([status])
  @@index([created_at, published_at])
  @@index([authorId])          // ✅ ADDED - for user's articles
  @@index([visibility])        // ✅ ADDED - for public/private filtering
  @@index([deleted_at])        // ✅ ADDED - for soft-delete cleanup
}

model users {
  user_id    String  @id @default(auto()) @map("_id") @db.ObjectId
  email      String  @unique
  password   String?
  first_name String
  last_name  String
  
  // ... other fields ...
  
  role String @default("USER")
  is_active Boolean @default(false)
  created_at DateTime @default(now())

  // ... other fields ...

  @@index([email, is_verified])
  @@index([email, deleted_at])
  @@index([role])              // ✅ ADDED - for admin queries
  @@index([is_active])         // ✅ ADDED - for active user queries
  @@index([created_at])        // ✅ ADDED - for pagination/sorting
}

model blacklist {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  token      String   @unique
  created_at DateTime @default(now())
  expire_at  DateTime

  @@index([token, expire_at])
  @@index([expire_at])
}

// After applying these changes:
// Run: npx prisma format
// Run: npx prisma migrate dev --name add-missing-indexes
```

---

## Issue 3: Fix Authorization Header Validation

**File**: `src/middlewares/auth.ts`

### Current (VULNERABLE):
```typescript
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract access token from request headers
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      log.warn('Authorization header is malformed');
      return response.unauthorized(req, res, 'Access token is required');
    }

    // ❌ VULNERABILITY: Removes "Bearer Bearer" prefix
    const accessToken = authHeader.replace('Bearer Bearer', 'Bearer').split(' ')[1] || '';
    // This accepts malformed tokens like "Bearer Bearer <token>"

    if (!accessToken) {
      return response.unauthorized(req, res, 'Access token is required');
    }

    // ... rest of implementation
  } catch (error: any) {
    log.error('Authentication error', { error: error.message, stack: error.stack });
    return response.unauthorized(req, res, 'Authentication failed');
  }
};
```

### Fixed (SECURE):
```typescript
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract access token from request headers
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      log.warn('Authorization header is missing');
      return response.unauthorized(req, res, 'Access token is required');
    }

    if (!authHeader.startsWith('Bearer ')) {
      log.warn('Authorization header format is invalid', { authHeader: authHeader.substring(0, 20) });
      return response.unauthorized(req, res, 'Invalid authorization header format. Use: Bearer <token>');
    }

    // ✅ FIX: Strict token extraction
    const accessToken = authHeader.slice(7);  // Remove 'Bearer ' prefix (7 characters)

    if (!accessToken || accessToken.length === 0) {
      log.warn('Authorization header contains empty token');
      return response.unauthorized(req, res, 'Access token is required');
    }

    // ✅ FIX: Reject if token contains spaces (malformed)
    if (accessToken.includes(' ')) {
      log.warn('Access token contains spaces (malformed)', { tokenLength: accessToken.length });
      return response.unauthorized(req, res, 'Invalid access token format');
    }

    // Check if token is blacklisted
    const isBlacklisted = await blackListToken.isBlackListToken(accessToken);
    if (isBlacklisted) {
      log.warn('Attempted access with blacklisted token');
      return response.unauthorized(req, res, 'Token has been revoked');
    }

    // Verify token validity
    const decoded = userToken.verifyAccessToken(accessToken);
    if (!decoded) {
      return response.unauthorized(req, res, 'Invalid access token');
    }

    // Attach user data to request object
    (req as any).user = decoded;

    next();
  } catch (error: any) {
    log.error('Authentication error', { error: error.message, stack: error.stack });
    return response.unauthorized(req, res, 'Authentication failed');
  }
};
```

---

## Issue 4: Fix Large File Upload Memory Leak

**File**: `src/middlewares/upload.ts`

### Current (VULNERABLE):
```typescript
import multer from 'multer';

// ❌ VULNERABILITY: Entire file loaded into memory
export const upload = multer({
  storage: multer.memoryStorage(),  // 500MB+ in heap!
  limits: { fileSize: 500 * 1024 * 1024 },  // 500 MB
  // No MIME type validation
  // No infection scanning before accepting
});
```

### Fixed (SAFE):
```typescript
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

// Create temp uploads directory
const uploadDir = '/tmp/uploads';
try {
  fs.mkdir(uploadDir, { recursive: true });
} catch (error) {
  console.error('Failed to create upload directory', error);
}

// ✅ FIX: Use disk storage with streaming
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// ✅ FIX: Validate MIME type BEFORE processing
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed MIME types
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'document/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimes.join(', ')}`));
  }
};

// ✅ FIX: Reasonable size limits
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,  // 100MB (reduced from 500MB)
    files: 1,                     // Only 1 file per request
    fields: 10                    // Limit form fields
  }
});

// ✅ BONUS: Cleanup middleware for failed uploads
export const cleanupOnError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (req.file && err) {
    fs.unlink(req.file.path).catch(console.error);
  }
  next(err);
};

// Usage in route:
// auth.post('/upload', upload.single('file'), cleanupOnError, controller.handleUpload);
```

---

## Issue 5: Add Login Rate Limiting

**File**: `src/router/users/auth.router.ts`

### Current (VULNERABLE):
```typescript
import { Router } from 'express';
import users_controller from '@/controllers/users/users.controller';
import { upload } from '@/middlewares/upload';
import { validationErrorHandler } from '@/middlewares/validationErrorHandler';
import { validate_user } from '@/services/validator/validate/users';

const auth = Router();

// ❌ No rate limiting on login
auth.post('/login', validate_user.login, validationErrorHandler, users_controller.login);
```

### Fixed (SECURE):
```typescript
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '@/services/caching/clients/redis-client';
import users_controller from '@/controllers/users/users.controller';
import { upload } from '@/middlewares/upload';
import { validationErrorHandler } from '@/middlewares/validationErrorHandler';
import { validate_user } from '@/services/validator/validate/users';
import { envs } from '@/config/env/env';

const auth = Router();

// ✅ FIX: Rate limiter for login attempts
// Tracks per email address, not per IP (more accurate)
const loginLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'login_attempts:',  // Redis key prefix
  }),
  windowMs: 15 * 60 * 1000,      // 15 minutes
  max: 5,                        // 5 attempts per window
  keyGenerator: (req) => {
    // Use email as key if available, otherwise use IP
    return req.body?.email || req.ip || 'unknown';
  },
  handler: (req, res) => {
    const email = req.body?.email || 'unknown';
    log.warn('Login rate limit exceeded', { email, ip: req.ip });
    
    return res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again in 15 minutes.',
      retryAfter: 900  // seconds
    });
  },
  skip: (req) => {
    // Skip rate limiting for certain IPs (e.g., internal)
    const whitelistedIPs = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
    return whitelistedIPs.includes(req.ip || '');
  },
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,   // Disable X-RateLimit-* headers
});

// ✅ FIX: Rate limiter for signup
const signupLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'signup_attempts:',
  }),
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 3,                     // 3 signups per hour per IP
  keyGenerator: (req) => req.ip || 'unknown',
  handler: (req, res) => {
    log.warn('Signup rate limit exceeded', { ip: req.ip });
    res.status(429).json({
      success: false,
      message: 'Too many signup attempts. Please try again later.',
    });
  },
});

// ✅ FIX: Rate limiter for password reset
const passwordResetLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'password_reset_attempts:',
  }),
  windowMs: 30 * 60 * 1000,  // 30 minutes
  max: 3,                     // 3 reset attempts per 30 min per email
  keyGenerator: (req) => req.body?.email || req.ip || 'unknown',
  handler: (req, res) => {
    log.warn('Password reset rate limit exceeded', { email: req.body?.email });
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts. Please try again later.',
    });
  },
});

// Apply limiters to routes
auth.post('/login', loginLimiter, validate_user.login, validationErrorHandler, users_controller.login);

auth.post(
  '/signup',
  signupLimiter,
  upload.single('profile'),
  validate_user.signup,
  validationErrorHandler,
  users_controller.signup,
);

auth.post(
  '/forgot-password',
  passwordResetLimiter,
  validate_user.forgotPassword,
  validationErrorHandler,
  users_controller.forgot_password,
);

// Other routes...
auth.post('/verify', validate_user.verifyAccount, validationErrorHandler, users_controller.verify_otp);
auth.post('/resend-otp', validate_user.resendOtp, validationErrorHandler, users_controller.resend_otp);

export default auth;
```

---

## Issue 6: Strengthen Input Validation

**File**: `src/services/validator/utils/utils.ts`

### Current (WEAK):
```typescript
import { body } from 'express-validator';

export const emailValidation = (field: string) => {
  return body(field)
    .trim()
    .notEmpty()
    .isEmail()
    .escape();  // ❌ Wrong - escape() doesn't prevent injection
};

export const nameValidation = (field: string) => {
  return body(field)
    .trim()
    .notEmpty()
    .isString()
    .isLength({ min: 2, max: 50 })
    .escape();  // Allows any Unicode
};

export const passwordValidation = () => {
  return body('password')
    .trim()
    .notEmpty()
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    });
};
```

### Fixed (STRONG):
```typescript
import { body } from 'express-validator';

// ✅ FIX: Email validation
export const emailValidation = (field: string) => {
  return body(field)
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()  // ✅ Normalize: remove dots, lowercase
    .isLength({ max: 254 })  // RFC 5321 max length
    .withMessage('Email is too long');
    // Don't use escape() - isEmail already validates format
};

// ✅ FIX: Name validation - only allow letters, spaces, hyphens, apostrophes
export const nameValidation = (field: string) => {
  return body(field)
    .trim()
    .notEmpty()
    .withMessage(`${field} is required`)
    .isString()
    .withMessage(`${field} must be a string`)
    .matches(/^[a-zA-Z\s\-'àâäæçéèêëìîïòôöœùûüÿñ]{2,50}$/)
    .withMessage(`${field} must be 2-50 letters long (letters, spaces, hyphens, apostrophes allowed)`)
    .escape();  // ✅ Only escape after validation
};

// ✅ FIX: Phone validation - E.164 format
export const phoneValidation = (field: string) => {
  return body(field)
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\+?[1-9]\d{1,14}$/)  // E.164: optional +, then digits
    .withMessage('Phone must be in E.164 format (e.g., +1234567890)');
};

// ✅ FIX: Enhanced password validation
export const passwordValidation = () => {
  return body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8-128 characters long')
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage('Password must contain uppercase, lowercase, number, and symbol')
    .matches(/^[\x20-\x7E]+$/)  // Only ASCII printable characters
    .withMessage('Password contains invalid characters');
};

// ✅ NEW: URL validation for redirects
export const urlValidation = (field: string, baseUrl: string) => {
  return body(field)
    .trim()
    .notEmpty()
    .custom((value) => {
      try {
        const url = new URL(value, baseUrl);
        // Only allow same domain
        if (url.hostname !== new URL(baseUrl).hostname) {
          throw new Error('Redirect URL must be same domain');
        }
        return true;
      } catch {
        throw new Error('Invalid URL format');
      }
    });
};

// ✅ NEW: OTP validation
export const otpValidation = () => {
  return body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP code is required')
    .isString()
    .isLength({ min: 4, max: 8 })
    .withMessage('OTP must be 4-8 characters')
    .matches(/^\d+$/)  // Only digits
    .withMessage('OTP must contain only digits');
};
```

---

## Issue 7: Fix Dockerfile Secrets Exposure

**File**: `Dockerfile`

### Current (VULNERABLE):
```dockerfile
# Line 22: Copy .env with secrets
COPY .env ./

# Line 45: Copy JWT keys into image
COPY --from=builder /usr/src/app/src/config/keys ./src/config/keys
```

### Fixed (SECURE):
```dockerfile
# Multi-stage build - Builder stage
FROM node:24-bookworm AS builder

WORKDIR /usr/src/app

# ✅ FIX: Don't copy .env - use build args instead
# COPY .env ./  # REMOVED

# Copy .env.example only for reference (doesn't contain secrets)
COPY .env.example ./

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
RUN npm install -g bun

COPY tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src/
COPY docs/openapi.config.js ./docs/

RUN mkdir -p node_modules
RUN echo "{\"dependencies\":{\"@config\":\"file:./src/config\",\"@services\":\"file:./src/services\",\"@middlewares\":\"file:./src/middlewares\",\"@router\":\"file:./src/router\",\"@utils\":\"file:./src/utils\"}}" > node_modules/package.json

RUN npm run generate:openapi && npm run prisma:generate
RUN npm run build

# Production stage
FROM node:24-bookworm AS production

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y wget gnupg && \
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | gpg --dearmor > /etc/apt/trusted.gpg.d/mongodb-6.0.gpg && \
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/6.0 main" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list && \
    apt-get update && apt-get install -y mongodb-database-tools && \
    rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# ✅ FIX: Copy .env.example only (no secrets)
COPY .env.example ./

COPY scripts/start-mongo.sh /usr/local/bin/start-mongo.sh
RUN chmod +x /usr/local/bin/start-mongo.sh

COPY module-alias.config.js ./
COPY docs/openapi.yaml /usr/src/app/docs/

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# ✅ FIX: Don't copy JWT keys - they'll be injected at runtime
# COPY --from=builder /usr/src/app/src/config/keys ./src/config/keys  # REMOVED

# ✅ FIX: Add non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /usr/src/app

USER appuser

EXPOSE 3000

# ✅ FIX: Accept JWT keys as runtime arguments/environment variables
# Keys will be injected via:
# - Kubernetes secrets mounted as files
# - Docker secrets
# - Environment variables
# See deployment-guide.md for details

CMD ["node", "-r", "module-alias/register", "-r", "./module-alias.config.js", "dist/index.js"]
```

**Runtime Key Injection** (Example with Docker Secrets):
```bash
# Create secrets
echo "-----BEGIN RSA PRIVATE KEY-----
...key content...
-----END RSA PRIVATE KEY-----" | docker secret create jwt_private_key -

echo "-----BEGIN PUBLIC KEY-----
...key content...
-----END PUBLIC KEY-----" | docker secret create jwt_public_key -

# Run with secrets
docker run \
  --secret jwt_private_key \
  --secret jwt_public_key \
  -e JWT_PRIVATE_KEY_PATH=/run/secrets/jwt_private_key \
  -e JWT_PUBLIC_KEY_PATH=/run/secrets/jwt_public_key \
  app:latest
```

**Runtime Key Injection** (Example with Kubernetes):
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: jwt-keys
type: Opaque
stringData:
  private.key: |
    -----BEGIN RSA PRIVATE KEY-----
    ...key content...
    -----END RSA PRIVATE KEY-----
  public.key: |
    -----BEGIN PUBLIC KEY-----
    ...key content...
    -----END PUBLIC KEY-----
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  template:
    spec:
      containers:
      - name: app
        image: app:latest
        env:
        - name: JWT_PRIVATE_KEY_PATH
          value: /etc/secrets/jwt/private.key
        - name: JWT_PUBLIC_KEY_PATH
          value: /etc/secrets/jwt/public.key
        volumeMounts:
        - name: jwt-keys
          mountPath: /etc/secrets/jwt
          readOnly: true
      volumes:
      - name: jwt-keys
        secret:
          secretName: jwt-keys
```

---

## Summary

These fixes address the top 7 critical issues:

1. ✅ **Auth middleware** - Restore protection
2. ✅ **Database indexes** - Improve query performance
3. ✅ **Auth header** - Reject malformed tokens
4. ✅ **File upload** - Prevent memory exhaustion
5. ✅ **Login limiting** - Prevent brute force
6. ✅ **Input validation** - Strengthen format checking
7. ✅ **Secrets management** - Inject at runtime

**Total implementation time**: 8-10 hours

**Priority**: Implement in this order:
1. Auth middleware (15 min)
2. Secrets injection (1 hour)
3. Database indexes (30 min)
4. File upload fix (2 hours)
5. Login rate limiting (30 min)
6. Input validation (2 hours)
7. Auth header fix (15 min)

After these fixes, run security audit and load tests before deploying to production.
