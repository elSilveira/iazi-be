#!/bin/sh
# Script to verify and test Docker build

echo "=== Testing Docker Build ==="
echo "This script will verify that the Dockerfile builds successfully"

# Check if files needed for the build exist
echo "Checking if required files exist..."
MISSING_FILES=0

check_file() {
  if [ ! -f "$1" ]; then
    echo "❌ Missing file: $1"
    MISSING_FILES=$((MISSING_FILES+1))
  else
    echo "✅ Found file: $1"
  fi
}

check_file "comprehensive-ts-build.sh"
check_file "emergency-build-ultra.sh"
check_file "diagnose-ts-errors.sh"
check_file "fix-permissions.sh"
check_file "docker-memory-optimize.sh"
check_file "healthcheck.sh"
check_file "deployment-diagnostics.js"
check_file "tsconfig.docker.json"
check_file "package.json"

if [ $MISSING_FILES -gt 0 ]; then
  echo "⚠️ Warning: $MISSING_FILES files are missing. The Docker build may fail."
  echo "Please create these files before building."
else
  echo "All required files are present."
fi

# Verify the Dockerfile syntax
echo "Verifying Dockerfile syntax..."
if [ -x "$(command -v docker)" ]; then
  docker build -t iazi-be-test-build:latest --target builder . && \
  echo "✅ Dockerfile syntax check passed."
else
  echo "⚠️ Docker command not found, cannot verify Dockerfile syntax."
fi

echo "=== Test Complete ==="
echo "If all checks passed, your Dockerfile should build successfully."
exit 0
