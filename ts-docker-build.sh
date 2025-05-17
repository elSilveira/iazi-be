#!/bin/bash
# TypeScript build script with error checking and handling

echo "======== STARTING TYPESCRIPT BUILD ========"

# Clean any previous build artifacts
if [ -d "./dist" ]; then
  echo "Cleaning existing build directory..."
  rm -rf ./dist
fi

# Set memory optimizations
export NODE_OPTIONS="--max-old-space-size=512 --expose-gc --gc-global"

# Check TypeScript version
echo "TypeScript version:"
npx tsc --version

# Show environment information
echo "Node version: $(node --version)"
echo "Memory available:"
free -m 2>/dev/null || echo "Memory info not available"

# Run TypeScript build with detailed output on failure
echo "Running TypeScript compilation..."
npx tsc

# Check build status
if [ $? -eq 0 ]; then
  echo "TypeScript build completed successfully!"
  echo "======== BUILD COMPLETE ========"
  exit 0
else
  echo "======== BUILD FAILED ========"
  echo "TypeScript compilation failed. Showing file issues:"
  
  # List all TypeScript files with possible errors
  find ./src -name "*.ts" -type f -exec npx tsc --noEmit --skipLibCheck {} \; 2>&1 | grep -A 1 "error TS"
  
  echo "======== ERROR DETAILS ========"
  exit 1
fi
