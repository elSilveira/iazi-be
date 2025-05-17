#!/bin/bash
# railway-startup-fix.sh - Script to ensure clean startup on Railway

echo "=== Railway Startup Fix Script ==="
echo "Running pre-startup checks and fixes..."

# 1. Verify environment variables
echo "Checking critical environment variables..."
MISSING_ENV=0

check_env() {
  if [ -z "${!1}" ]; then
    echo "⚠️ Missing environment variable: $1"
    MISSING_ENV=$((MISSING_ENV + 1))
    return 1
  else
    echo "✅ Environment variable present: $1"
    return 0
  fi
}

# Check essential environment variables
check_env "DATABASE_URL"
check_env "PORT" || echo "Using default PORT: 3002"
check_env "JWT_SECRET" || echo "Warning: Missing JWT_SECRET could affect authentication"

if [ $MISSING_ENV -gt 0 ]; then
  echo "⚠️ $MISSING_ENV environment variables missing. Application may not function correctly."
else
  echo "✅ All critical environment variables are present."
fi

# 2. Verify Prisma can connect to the database
echo "Testing database connection..."
DATABASE_TEST=$(npx prisma db pull --preview-feature 2>&1 || echo "ERROR")

if echo "$DATABASE_TEST" | grep -q "ERROR\|Error"; then
  echo "⚠️ Prisma database connection test failed. Application may not be able to access the database."
  echo "Attempting to regenerate Prisma client as a workaround..."
  PRISMA_CLI_MEMORY_MIN=64 PRISMA_CLI_MEMORY_MAX=512 npx prisma generate
else
  echo "✅ Database connection test passed."
fi

# 3. Ensure correct file permissions
echo "Setting correct file permissions..."
chmod +x healthcheck.sh 2>/dev/null || echo "Warning: could not set executable permission on healthcheck.sh"
chmod +x /usr/local/bin/docker-memory-optimize.sh 2>/dev/null || echo "Warning: could not set executable permission on docker-memory-optimize.sh"

# 4. Apply memory optimizations for Railway
echo "Applying memory optimizations for Railway environment..."
NODE_OPTIONS="--max-old-space-size=512 --expose-gc"
export NODE_OPTIONS

# Output diagnostics for debugging
echo "=== Environment Diagnostics ==="
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DATABASE_URL present: $(if [ -n "$DATABASE_URL" ]; then echo "Yes"; else echo "No"; fi)"
echo "NODE_OPTIONS: $NODE_OPTIONS"
echo "Current working directory: $(pwd)"
echo "Files in current directory: $(ls -la | wc -l) files"
echo "Memory usage: $(free -h 2>/dev/null || echo "Not available on this system")"

echo "=== Railway Startup Fix Complete ==="
echo "Starting application..."

exit 0
