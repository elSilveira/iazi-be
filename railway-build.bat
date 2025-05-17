#!/bin/bash
set -e

# Simple Railway build script
echo "Starting Railway build with simplified configuration..."

# Generate Prisma client during build phase
npx prisma generate

# Build TypeScript application
npm run build

echo "Railway build completed successfully!"
