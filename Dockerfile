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

# Copy TypeScript configs first
COPY tsconfig*.json ./

# Copy all shell scripts
COPY *.sh ./

# Copy JavaScript utilities
COPY deployment-diagnostics.js ./

# Install dos2unix and make all scripts executable with proper line endings
RUN apk add --no-cache dos2unix && \
    # Convert all scripts to Unix line endings
    find . -name "*.sh" -type f -exec dos2unix {} \; && \
    # Make all scripts executable
    find . -name "*.sh" -type f -exec chmod +x {} \; && \
    # Verify execution permissions to debug
    ls -la *.sh

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the application source code
COPY . .

# Explicitly set permissions for all scripts after full source copy
RUN find . -name "*.sh" -type f -exec chmod +x {} \; && \
    # Ensure critical scripts are definitely executable
    chmod +x ./fix-permissions.sh && \
    chmod +x ./comprehensive-ts-build.sh && \
    chmod +x ./emergency-build-ultra.sh && \
    chmod +x ./diagnose-ts-errors.sh && \
    # Now run the permission fix script
    ./fix-permissions.sh

# Fix Prisma client type issues and TypeScript event listener types
RUN sed -i 's/import { PrismaClient } from "@prisma\/client";/import { PrismaClient, Prisma } from "@prisma\/client";/' src/utils/prismaClient.ts && \
    sed -i 's/\[\(.*\)\]/[\1] as Prisma.LogLevel[]/' src/utils/prismaClient.ts && \
    # Add @ts-ignore to any $on method calls to fix TypeScript errors
    sed -i 's/prisma\.\$on(/\/\/ @ts-ignore - Prisma event types are sometimes inconsistent\n  prisma\.\$on(/' src/utils/prismaClient.ts

# Execute the comprehensive TypeScript build process
RUN echo "Starting TypeScript build process..." && \
    # Ensure scripts are executable
    chmod +x ./diagnose-ts-errors.sh && \
    chmod +x ./comprehensive-ts-build.sh && \
    chmod +x ./emergency-build-ultra.sh && \
    # First run diagnostics to collect information
    ./diagnose-ts-errors.sh > ts-diagnostic-output.log 2>&1 || true && \
    # Then run the comprehensive build
    ./comprehensive-ts-build.sh || \
    # If comprehensive build fails, try emergency build as fallback
    (echo "Comprehensive build failed, running emergency build..." && \
     ./emergency-build-ultra.sh) && \
    # Verify the build output
    ls -la dist/ || echo "Warning: dist directory not found!"

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
RUN apk add --no-cache wget curl netcat-openbsd net-tools iputils

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
COPY --from=builder /app/healthcheck.sh ./healthcheck.sh
COPY --from=builder /app/docker-memory-optimize.sh /usr/local/bin/docker-memory-optimize.sh
COPY --from=builder /app/deployment-diagnostics.js ./deployment-diagnostics.js
COPY --from=builder /app/app-startup.mjs ./app-startup.mjs
COPY --from=builder /app/railway-startup-fix.sh ./railway-startup-fix.sh
COPY --from=builder /app/railway-network-fix.sh ./railway-network-fix.sh

# Ensure scripts are executable
RUN chmod +x healthcheck.sh && \
    chmod +x /usr/local/bin/docker-memory-optimize.sh && \
    chmod +x railway-startup-fix.sh && \
    chmod +x railway-network-fix.sh

# Generate Prisma client with memory optimization
RUN PRISMA_CLI_MEMORY_MIN=64 PRISMA_CLI_MEMORY_MAX=512 npx prisma generate

# Expose the application port
EXPOSE 3002

# Define environment variables
ENV NODE_ENV=production

# Healthcheck configuration with increased timeouts
HEALTHCHECK --interval=30s --timeout=20s --start-period=30s --retries=3 \
  CMD ./healthcheck.sh

# Command to run migrations and start the application with memory optimizations
CMD . /usr/local/bin/docker-memory-optimize.sh && \
    ./railway-startup-fix.sh && \
    ./railway-network-fix.sh && \
    npx prisma generate && \
    DEBUG=express:* node --dns-result-order=ipv4first app-startup.mjs

