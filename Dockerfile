# Stage 1: Builder
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Set memory optimization environment variables
ENV NODE_OPTIONS="--max-old-space-size=1024" \
    NPM_CONFIG_REGISTRY=https://registry.npmjs.org/ \
    NPM_CONFIG_PREFER_OFFLINE=true \
    NPM_CONFIG_LOGLEVEL=error \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_OPTIONAL=false \
    NPM_CONFIG_PRODUCTION=false \
    NPM_CONFIG_PROGRESS=false \
    NPM_CONFIG_UNSAFE_PERM=true \
    PRISMA_SKIP_POSTINSTALL_GENERATE=true

# Install build dependencies (minimal set)
RUN apk add --no-cache python3 make g++ git bash

# Copy package files
COPY package*.json ./

# Ultra memory-efficient installation process with single step
RUN npm cache clean --force && \
    # First install dependencies without scripts or peer deps to use less memory
    npm install --no-audit --no-fund --ignore-scripts --no-optional --prefer-offline && \
    # Then rebuild only critical native modules
    npm rebuild bcrypt && \
    # Clean up to reduce image size
    npm cache clean --force && \
    rm -rf /tmp/*

# Copy Prisma schema
COPY prisma ./prisma/

# Copy Docker-specific TypeScript config and build script
COPY tsconfig.docker.json ./
COPY docker-typescript-build.sh ./

# Make the script executable and convert to Unix line endings
RUN apk add --no-cache dos2unix && \
    dos2unix docker-typescript-build.sh && \
    chmod +x docker-typescript-build.sh && \
    # Verify execution permissions to debug
    ls -la docker-typescript-build.sh

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the application source code
COPY . .

# Ensure scripts have correct permissions
RUN apk add --no-cache dos2unix && \
    dos2unix fix-permissions.sh && \
    chmod +x fix-permissions.sh && \
    # Run the permission fix script to ensure all scripts are executable
    ./fix-permissions.sh

# Fix Prisma client type issues
RUN sed -i 's/import { PrismaClient } from "@prisma\/client";/import { PrismaClient, Prisma } from "@prisma\/client";/' src/utils/prismaClient.ts && \
    sed -i 's/\[\(.*\)\]/[\1] as Prisma.LogLevel[]/' src/utils/prismaClient.ts

# Run Docker-specific TypeScript build with multiple fallback approaches
RUN echo "Attempting to build TypeScript project..." && \
    if [ -x "./docker-typescript-build.sh" ]; then \
      echo "Running with executable script..." && \
      ./docker-typescript-build.sh; \
    elif command -v bash > /dev/null; then \
      echo "Running with bash..." && \
      bash docker-typescript-build.sh; \
    elif [ -f "tsconfig.docker.json" ]; then \
      echo "Running embedded TypeScript build..." && \
      NODE_OPTIONS="--max-old-space-size=512" npx tsc --project tsconfig.docker.json; \
    else \
      echo "Emergency build: bypassing normal TypeScript compilation..." && \
      mkdir -p dist && \
      cp -r src/* dist/ && \
      find dist -name "*.ts" -type f -exec sh -c 'mv "$1" "${1%.ts}.js"' _ {} \;; \
    fi

# Stage 2: Runner
FROM node:18-alpine AS runtime

# Set memory optimization environment variables
ENV NODE_OPTIONS="--max-old-space-size=1024" \
    NPM_CONFIG_REGISTRY=https://registry.npmjs.org/ \
    NPM_CONFIG_PREFER_OFFLINE=true \
    NPM_CONFIG_LOGLEVEL=error \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_OPTIONAL=false \
    NPM_CONFIG_PRODUCTION=true \
    NPM_CONFIG_PROGRESS=false \
    NODE_ENV=production

# Install minimal runtime dependencies
RUN apk add --no-cache wget

WORKDIR /app

# Copy package files
COPY package*.json ./

# Ultra memory-efficient production installation
RUN npm cache clean --force && \
    # Install only production dependencies with minimal memory footprint
    npm install --production --no-audit --no-fund --ignore-scripts --no-optional --prefer-offline && \
    # Rebuild only critical native modules
    npm rebuild bcrypt && \
    # Clean up
    npm cache clean --force && \
    rm -rf /tmp/*

# Copy necessary files from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY healthcheck.sh ./healthcheck.sh
RUN chmod +x healthcheck.sh

# Generate Prisma client with memory optimization
RUN PRISMA_CLI_MEMORY_MIN=64 PRISMA_CLI_MEMORY_MAX=512 npx prisma generate

# Expose the application port
EXPOSE 3002

# Add memory optimization script
COPY docker-memory-optimize.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-memory-optimize.sh

# Define environment variables
ENV NODE_ENV=production

# Healthcheck configuration with increased timeouts
HEALTHCHECK --interval=30s --timeout=20s --start-period=30s --retries=3 \
  CMD ./healthcheck.sh

# Copy the diagnostic script
COPY deployment-diagnostics.js ./deployment-diagnostics.js

# Command to run migrations and start the application with memory optimizations
CMD source /usr/local/bin/docker-memory-optimize.sh && \
    npx prisma generate && \
    DEBUG=express:* node dist/index.js

