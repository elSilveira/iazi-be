# Stage 1: Builder
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install Prisma CLI globally (optional, but can be useful)
# RUN npm install -g prisma

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build and prisma generate)
RUN npm install

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma Client (needed for build if types are imported)
RUN npx prisma generate

# Copy the rest of the application source code
COPY . .

# Build the TypeScript project
RUN npm run build

# Prune devDependencies for the final stage
RUN npm prune --production

# Stage 2: Runner
FROM node:20-alpine

WORKDIR /app

# Copy necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# Make sure Prisma client is properly generated and available
RUN npm install --only=production
RUN npx prisma generate

# Expose the application port (ensure it matches the PORT env var, default 3002)
EXPOSE 3002

# Define environment variables (can be overridden at runtime)
ENV NODE_ENV=production
# PORT=3002 # Already set in .env, but can be set here as default

# Command to run migrations and start the application
# Option 1: Run migrations before starting (simpler for some platforms)
# CMD npx prisma migrate deploy && node dist/index.js

# Option 2: Start the application directly (migrations handled externally)
# This is often preferred as the container shouldn't necessarily handle migrations.
CMD npx prisma generate && node dist/index.js

# Healthcheck (optional but recommended)
# HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD curl --fail http://localhost:3002/api/health || exit 1

