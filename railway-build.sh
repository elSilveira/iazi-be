#!/bin/bash
set -e

# Railway build script with extreme memory optimizations

# Print system information for debugging
echo "🖥️ System Information:"
free -h || true
df -h || true

# Set memory limits
echo "🧠 Setting extreme memory optimization parameters..."
export NODE_OPTIONS="--max-old-space-size=512 --expose-gc --gc-global"
export NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
export NPM_CONFIG_PREFER_OFFLINE=true
export NPM_CONFIG_LOGLEVEL=error
export NPM_CONFIG_AUDIT=false
export NPM_CONFIG_FUND=false
export NPM_CONFIG_OPTIONAL=false
export NPM_CONFIG_PROGRESS=false
export NPM_CONFIG_UPDATE_NOTIFIER=false
export PRISMA_SKIP_POSTINSTALL_GENERATE=true
export PRISMA_CLI_MEMORY_MIN=64
export PRISMA_CLI_MEMORY_MAX=512

# Clean npm cache
echo "🧹 Aggressive cache cleanup..."
npm cache clean --force
rm -rf /tmp/* ~/.npm

# Ultra memory-efficient installation
echo "📦 Installing dependencies with ultra memory-efficient approach..."
echo "Installing without scripts to minimize memory usage..."
npm install --no-audit --no-fund --ignore-scripts --no-optional --prefer-offline || {
    echo "⚠️ Full install failed, trying production only..."
    npm install --production --no-audit --no-fund --ignore-scripts --no-optional --prefer-offline
}

# Only rebuild critical native modules
echo "🔄 Rebuilding only critical native modules..."
npm rebuild bcrypt || echo "⚠️ Bcrypt rebuild failed, app may not work correctly"

# Generate Prisma client
echo "🔧 Generating Prisma client with memory limits..."
PRISMA_CLI_MEMORY_MIN=64 PRISMA_CLI_MEMORY_MAX=512 npx prisma generate

# Clean up
echo "🧹 Final cleanup to free memory..."
npm cache clean --force
rm -rf /tmp/* ~/.npm

# Build TypeScript application
echo "🏗️ Building TypeScript application with tight memory constraints..."
NODE_OPTIONS="--max-old-space-size=512 --expose-gc --gc-global" npm run build

echo "✅ Railway build completed successfully!"
