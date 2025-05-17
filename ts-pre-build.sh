#!/bin/bash
set -e

# Pre-build validation and fix script
echo "========== TypeScript Pre-Build Validation =========="

# Install dependencies needed for TypeScript checks
echo "Installing TypeScript validation dependencies..."
npm list typescript || npm install --no-save typescript@latest

# Check TypeScript configuration
echo "Validating tsconfig.json..."
if [ -f "tsconfig.json" ]; then
  echo "tsconfig.json exists, validating content..."
  # Add strict null checks option if not present
  if ! grep -q "strictNullChecks" tsconfig.json; then
    echo "Adding strictNullChecks to tsconfig.json..."
    sed -i 's/"strict": true,/"strict": true,\n    "strictNullChecks": true,/' tsconfig.json
  fi
else
  echo "ERROR: tsconfig.json not found. Creating minimal version..."
  cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
EOF
fi

# Fix Prisma TypeScript issues
echo "Checking for Prisma TypeScript issues..."
if [ -f "src/utils/prismaClient.ts" ]; then
  echo "Checking prismaClient.ts for type issues..."
  
  # Check if we need to add type imports
  if ! grep -q "import { PrismaClient, Prisma }" src/utils/prismaClient.ts; then
    echo "Fixing Prisma imports in prismaClient.ts..."
    # Replace basic import with expanded import that includes types
    sed -i 's/import { PrismaClient } from "@prisma\/client";/import { PrismaClient, Prisma } from "@prisma\/client";/' src/utils/prismaClient.ts
  fi
  
  # Fix log level type errors
  if grep -q "log:" src/utils/prismaClient.ts; then
    echo "Fixing Prisma log level typing..."
    # Add type assertion to log levels
    sed -i 's/\[\(.*\)\]/[\1] as Prisma.LogLevel[]/' src/utils/prismaClient.ts
  fi
fi

echo "Performing TypeScript type check..."
# Run TypeScript check without emitting files
npx tsc --noEmit

echo "========== Pre-Build Validation Complete =========="
echo "You can now proceed with the regular build."
exit 0
