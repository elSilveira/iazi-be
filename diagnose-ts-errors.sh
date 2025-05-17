#!/bin/sh
# TypeScript diagnostic script
echo "=== TypeScript Diagnostics ==="

# Check TypeScript version
echo "TypeScript version:"
npx tsc --version

# Check node modules existence
echo "Checking node_modules:"
if [ -d "node_modules" ]; then
  echo "✅ node_modules found"
  ls -la node_modules/@prisma 2>/dev/null || echo "⚠️ Prisma modules may be missing"
else
  echo "❌ node_modules missing or not complete"
fi

# Check tsconfig files
echo "TypeScript config files:"
ls -la tsconfig*.json 2>/dev/null || echo "No tsconfig files found"

# Check src directory
echo "Source files:"
find src -name "*.ts" | wc -l
find src -name "*.ts" | head -n 5

# Attempt a dry run of TypeScript compilation with more diagnostic info
echo "Running TypeScript check with extra diagnostics:"
NODE_OPTIONS="--max-old-space-size=1024" npx tsc --noEmit --listFiles --diagnostics 2>&1 | head -n 30

echo "=== Diagnostic Complete ==="
exit 0
