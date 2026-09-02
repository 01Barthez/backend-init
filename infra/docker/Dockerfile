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
COPY module-alias.config.js ./

RUN npm run prisma:generate && npm run build

# =============================================================================
# Stage 3: Production runtime
# =============================================================================
FROM node:22-bookworm-slim AS production

COPY --from=mongo-tools /usr/bin/mongodump /usr/bin/mongodump

ENV NODE_ENV=production
WORKDIR /app

RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY module-alias.config.js ./
COPY docs/openapi.yaml ./docs/

# JWT keys must be mounted at runtime via secrets volume — NOT baked into the image
RUN mkdir -p /app/keys && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "-r", "module-alias/register", "-r", "./module-alias.config.js", "dist/index.js"]
