#!/bin/sh
# This script applies runtime memory optimizations for npm in Docker

# Set memory limit for Node.js (much smaller than default)
export NODE_OPTIONS="--max-old-space-size=512"

# Strict memory limits for npm
export NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
export NPM_CONFIG_PREFER_OFFLINE=true
export NPM_CONFIG_LOGLEVEL=error
export NPM_CONFIG_AUDIT=false
export NPM_CONFIG_FUND=false
export NPM_CONFIG_OPTIONAL=false
export NPM_CONFIG_PRODUCTION=true
export NPM_CONFIG_PROGRESS=false
export NPM_CONFIG_UPDATE_NOTIFIER=false
export NPM_CONFIG_UNSAFE_PERM=true

# Cleanup function
cleanup() {
  echo "Cleaning npm cache and temp files..."
  npm cache clean --force
  rm -rf /tmp/*
  rm -rf ~/.npm
}

# Targeted rebuild function
rebuild_targeted() {
  echo "Rebuilding only critical native modules..."
  npm rebuild bcrypt
}

# Apply GC optimization
echo "Setting aggressive garbage collection..."
export NODE_OPTIONS="$NODE_OPTIONS --expose-gc --gc-global"

# Print memory info (if available)
free -m 2>/dev/null || echo "Memory info not available"

# Return success
echo "Memory optimizations applied."
exit 0
