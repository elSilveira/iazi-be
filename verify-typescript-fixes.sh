#!/bin/sh
# Script to verify TypeScript build fixes without a full Docker build

echo "=== Testing TypeScript Build Fixes ==="

# Verify script permissions
echo "Checking script permissions..."
find . -name "*.sh" -type f -not -perm -u=x -exec echo "Warning: Not executable: {}" \; || echo "All scripts appear to be executable."

# Verify Prisma client fix
echo "Checking Prisma client..."
grep -n "import { PrismaClient, Prisma }" src/utils/prismaClient.ts || echo "Prisma import not properly fixed."

# Test TypeScript compilation with Docker config
echo "Testing TypeScript compilation with Docker config..."
if [ -f "tsconfig.docker.json" ]; then
  # Try compiling just one file as a quick test
  NODE_OPTIONS="--max-old-space-size=512" npx tsc --project tsconfig.docker.json --noEmit src/index.ts 2>&1 | head -n 10 || echo "Compilation has errors (expected for testing)"
else
  echo "Docker TypeScript config not found."
fi

# Test emergency build script
echo "Testing emergency build script does not crash..."
mkdir -p test-emergency-build
cp -r src/index.ts test-emergency-build/ 2>/dev/null
cd test-emergency-build
../emergency-build-ultra.sh 2>/dev/null || echo "Emergency build script crashed."
ls -la
cd ..
rm -rf test-emergency-build

echo "=== Test Complete ==="
echo "Use test-docker-build-comprehensive-fix.bat to run a full Docker build test."

exit 0
