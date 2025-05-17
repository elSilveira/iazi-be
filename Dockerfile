# Stage 1: Builder
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package*.json ./

# Install dependencies with improved error handling and network resilience
RUN echo "Network information for troubleshooting:" && \
    ping -c 2 registry.npmjs.org || true && \
    echo "Trying npm installation with various fallback options" && \
    npm config set network-timeout 300000 && \
    npm config set fetch-retries 3 && \
    npm config set fetch-retry-mintimeout 15000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm cache clean --force && \
    npm install --no-audit --no-fund --loglevel verbose || \
    npm install --no-audit --no-fund --loglevel verbose --legacy-peer-deps || \
    npm install --no-audit --no-fund --loglevel verbose --legacy-peer-deps --no-optional

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma Client (needed for build if types are imported)
RUN npx prisma generate

# Copy the rest of the application source code
COPY . .

# Build the TypeScript project
RUN npm run build

# Stage 2: Runner
FROM node:18-alpine

# Install dependencies for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies with enhanced error handling
RUN npm config set network-timeout 300000 && \
    npm config set fetch-retries 3 && \
    npm config set fetch-retry-mintimeout 15000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --only=production --no-audit --no-fund || \
    npm install --only=production --no-audit --no-fund --legacy-peer-deps || \
    npm install --only=production --no-audit --no-fund --legacy-peer-deps --no-optional

# Copy necessary files from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY healthcheck.sh ./healthcheck.sh
RUN chmod +x healthcheck.sh

# Generate Prisma client
RUN npx prisma generate

# Expose the application port (ensure it matches the PORT env var, default 3002)
EXPOSE 3002

# Define environment variables
ENV NODE_ENV=production

# Healthcheck configuration
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ./healthcheck.sh

# Command to run migrations and start the application
CMD npx prisma generate && node dist/index.js

