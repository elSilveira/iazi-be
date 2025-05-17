#!/bin/bash
set -e

# Railway build script with advanced memory optimizations

# Print system information for debugging
echo "🖥️ System Information:"
free -h || true
df -h || true

# Set memory limits
echo "🧠 Setting memory optimization parameters..."
export NODE_OPTIONS="--max-old-space-size=2048"
export NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
export NPM_CONFIG_PREFER_OFFLINE=true
export NPM_CONFIG_LOGLEVEL=error
export NPM_CONFIG_AUDIT=false
export NPM_CONFIG_FUND=false

# Clean npm cache
echo "🧹 Cleaning npm cache..."
npm cache clean --force

# Staged installation approach to minimize memory usage
echo "📦 Installing dependencies with memory-efficient approach..."
echo "Stage 1: Installing production dependencies without scripts..."
npm install --only=production --no-audit --no-fund --ignore-scripts --prefer-offline || {
    echo "⚠️ Production install failed, trying with less memory usage..."
    npm install --only=production --no-audit --no-fund --ignore-scripts --prefer-offline --no-optional
}

echo "Stage 2: Rebuilding native modules..."
npm rebuild || {
    echo "⚠️ Rebuild failed, trying individual rebuilds..."
    for pkg in bcrypt; do
        echo "Rebuilding $pkg..."
        npm rebuild $pkg || true
    done
}

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build TypeScript application
echo "🏗️ Building TypeScript application..."
npm run build

echo "✅ Railway build completed successfully!"
