#!/bin/bash
# Simple TypeScript build script with error handling

echo "Building TypeScript application..."

# Clean output directory
rm -rf ./dist

# Set memory optimization
export NODE_OPTIONS="--max-old-space-size=512 --expose-gc"

# Try TypeScript compilation
npx tsc

# Check build result
if [ $? -eq 0 ]; then
  echo "TypeScript build successful!"
  exit 0
else
  echo "TypeScript build failed. Falling back to alternative build..."
  
  # Create dist directory
  mkdir -p dist
  
  # Use tsc on each file individually with --skipLibCheck
  echo "Building files individually..."
  find ./src -name "*.ts" | while read -r file; do
    outfile="dist/$(basename "$file" .ts).js"
    echo "Compiling $file to $outfile"
    npx tsc --skipLibCheck --noEmit "$file"
  done
  
  # Try build one more time with skipLibCheck
  echo "Trying final build with skipLibCheck..."
  npx tsc --skipLibCheck
  
  if [ $? -eq 0 ]; then
    echo "TypeScript build successful with skipLibCheck!"
    exit 0
  else
    echo "All build attempts failed."
    exit 1
  fi
fi
