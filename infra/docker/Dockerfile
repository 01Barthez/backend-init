# =============================================================================
# Stage 0: MongoDB tools (mongodump not in default Debian repos)
# =============================================================================
FROM mongo:6.0-jammy AS mongo-tools

# =============================================================================
# Stage 1: Dependencies
# =============================================================================
FROM node:22-bookworm-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# =============================================================================
# Stage 2: Build
# =============================================================================
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src/
COPY docs ./docs/

RUN npm run prisma:generate && npm run build

# =============================================================================
# Stage 3: Production runtime
# =============================================================================
FROM node:22-bookworm-slim AS production

# Copy mongodump binary from the official Mongo image (avoids apt DNS issues).
COPY --from=mongo-tools /usr/bin/mongodump /usr/bin/mongodump

ENV NODE_ENV=production
WORKDIR /app

# The official node image already provides UID/GID 1000 (`node`). Reuse it so
# bind-mounted host `keys/*.pem` (mode 600, owned by a typical developer UID)
# remain readable. Do not create a second user with the same ids.
COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
RUN npm prune --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY docs/api/openapi.yaml ./docs/api/openapi.yaml
COPY .env.example ./.env.example

# JWT keys are mounted at runtime (`./keys:/app/keys`). Never bake PEMs into the image.
# Optional logs/ dir for LOG_TO_FILE=true; ops default is stdout (+ Loki).
RUN mkdir -p /app/keys /app/logs/security && chown -R node:node /app/keys /app/logs

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# module-alias resolves package.json "_moduleAliases" when registering the package root.
CMD ["node", "-r", "module-alias/register", "dist/index.js"]
