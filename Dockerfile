# Stage 1: Builder
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package*.json ./

# Simpler installation process with minimal dependencies
RUN npm cache clean --force && \
    npm ci || npm install

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

# Install wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production || npm install --only=production

# Copy necessary files from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY healthcheck.sh ./healthcheck.sh
RUN chmod +x healthcheck.sh

# Generate Prisma client
RUN npx prisma generate

# Expose the application port
EXPOSE 3002

# Define environment variables
ENV NODE_ENV=production

# Healthcheck configuration
HEALTHCHECK --interval=30s --timeout=15s --start-period=15s --retries=3 \
  CMD ./healthcheck.sh

# Command to run migrations and start the application
CMD npx prisma generate && node dist/index.js

