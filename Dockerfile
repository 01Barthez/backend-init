# Étape 1: Build
FROM node:24-bookworm AS builder

WORKDIR /usr/src/app

COPY .env.example ./
COPY .env ./

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source code
COPY tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src/
COPY docs/openapi.config.js ./docs/

# Set up module aliases
RUN mkdir -p node_modules
RUN echo "{\"dependencies\":{\"@config\":\"file:./src/config\",\"@services\":\"file:./src/services\",\"@middlewares\":\"file:./src/middlewares\",\"@router\":\"file:./src/router\",\"@utils\":\"file:./src/utils\"}}" > node_modules/package.json

# Generate OpenAPI and Prisma client
RUN npm run generate:openapi && npm run prisma:generate

# Build TypeScript
RUN npm run build

# Étape 2: Production
FROM node:24-bookworm AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy environment files
COPY --from=builder /usr/src/app/.env.example ./
COPY --from=builder /usr/src/app/.env ./

# Copy docs directory
COPY --from=builder /usr/src/app/docs ./docs

# Copy and set permissions for MongoDB startup script
COPY scripts/start-mongo.sh /usr/local/bin/start-mongo.sh
RUN chmod +x /usr/local/bin/start-mongo.sh

# Set up module aliases in node_modules
COPY module-alias.config.js ./

# Set up open ai doc
COPY docs/openapi.yaml /usr/src/app/docs/

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts


# Copy build output and prisma schema
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Copy JWT keys from source
COPY --from=builder /usr/src/app/src/config/keys ./src/config/keys

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "-r", "module-alias/register", "-r", "./module-alias.config.js", "dist/index.js"]
