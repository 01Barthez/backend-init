# Étape 1: Build
FROM node:24-bookworm AS builder

WORKDIR /usr/src/app

COPY .env.example ./
COPY .env ./

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY prisma ./prisma/
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Étape 2: Production
FROM node:24-bookworm AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy environment files
COPY --from=builder /usr/src/app/.env.example ./
COPY --from=builder /usr/src/app/.env ./

# Copy and set permissions for MongoDB startup script
COPY scripts/start-mongo.sh /usr/local/bin/start-mongo.sh
RUN chmod +x /usr/local/bin/start-mongo.sh

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy build output and prisma schema
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 3000

# Start app
CMD ["node", "dist/index.js"]
