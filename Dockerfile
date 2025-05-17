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
RUN apk add --no-cache python3 make g++ git

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

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the application source code
COPY . .

# Build the TypeScript project
RUN npm run build

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
HEALTHCHECK --interval=30s --timeout=20s --start-period=20s --retries=3 \
  CMD ./healthcheck.sh

# Command to run migrations and start the application with memory optimizations
CMD source /usr/local/bin/docker-memory-optimize.sh && npx prisma generate && node dist/index.js

