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

RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
RUN npm prune --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY docs/api/openapi.yaml ./docs/api/openapi.yaml
COPY docs/openapi.yaml ./docs/openapi.yaml

# Example env schema (optional validation) + JWT key material for local Compose.
# Production should mount keys via secrets and inject env from the orchestrator.
COPY .env.example ./.env.example
COPY src/app/config/keys ./src/app/config/keys

# JWT keys must be mounted at runtime via secrets in production when not baked in.
RUN mkdir -p /app/keys && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# module-alias resolves package.json "_moduleAliases" when registering the package root.
CMD ["node", "-r", "module-alias/register", "dist/index.js"]
