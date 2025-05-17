#!/bin/bash
# TypeScript health check script

# Find all TypeScript files
TS_FILES=$(find ./src -name "*.ts" -type f)
ERROR_COUNT=0
SUSPICIOUS_PATTERNS=(
  "Prisma\.(.*) .*\["  # Potential Prisma array type issues
  "import.*from.*prisma"  # Prisma imports that might cause issues
  "\$on\("  # Prisma event handlers
  "as Prisma\."  # Type assertions with Prisma
)

echo "Checking TypeScript files for common issues..."

# Check for common issues in TypeScript files
for file in $TS_FILES; do
  for pattern in "${SUSPICIOUS_PATTERNS[@]}"; do
    if grep -q "$pattern" "$file"; then
      echo "⚠️ Potential issue in $file: matches pattern '$pattern'"
      grep -n "$pattern" "$file"
      ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
  done
done

echo "TypeScript health check completed. Found $ERROR_COUNT potential issues."

# Check for prismaClient.ts specific issues
if [ -f "./src/utils/prismaClient.ts" ]; then
  echo "Analyzing prismaClient.ts specifically..."
  cat ./src/utils/prismaClient.ts
  echo "-----"
fi

exit 0
