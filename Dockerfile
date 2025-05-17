# Stage 1: Builder
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Set memory optimization environment variables
ENV NODE_OPTIONS="--max-old-space-size=2048" \
    NPM_CONFIG_REGISTRY=https://registry.npmjs.org/ \
    NPM_CONFIG_PREFER_OFFLINE=true \
    NPM_CONFIG_LOGLEVEL=error \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package*.json ./

# Memory-efficient installation process - split into multiple steps
RUN npm cache clean --force
RUN npm install --no-audit --no-fund --only=prod --ignore-scripts 
RUN npm install --no-audit --no-fund --only=dev --ignore-scripts
RUN npm rebuild

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the application source code
COPY . .

# Build the TypeScript project
RUN npm run build

# Stage 2: Runner
FROM node:18-alpine

# Set memory optimization environment variables
ENV NODE_OPTIONS="--max-old-space-size=2048" \
    NPM_CONFIG_REGISTRY=https://registry.npmjs.org/ \
    NPM_CONFIG_PREFER_OFFLINE=true \
    NPM_CONFIG_LOGLEVEL=error \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NODE_ENV=production

# Install wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Copy package files
COPY package*.json ./

# Memory-efficient production installation - using multiple steps to reduce memory usage
RUN npm cache clean --force
RUN npm install --only=production --no-audit --no-fund --ignore-scripts --prefer-offline
RUN npm rebuild

# Copy necessary files from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY healthcheck.sh ./healthcheck.sh
RUN chmod +x healthcheck.sh

# Generate Prisma client with memory optimization
RUN npx prisma generate

# Expose the application port
EXPOSE 3002

# Define environment variables
ENV NODE_ENV=production

# Healthcheck configuration with increased timeouts
HEALTHCHECK --interval=30s --timeout=20s --start-period=20s --retries=3 \
  CMD ./healthcheck.sh

# Command to run migrations and start the application
CMD npx prisma generate && node dist/index.js

