#!/bin/sh
# Script to build and test the Docker image

echo "=== Building and Testing Docker Image ==="

# Set memory limits for Docker build
export DOCKER_BUILDKIT=1
export DOCKER_CLI_EXPERIMENTAL=enabled

# Clean up any old containers and images
echo "Cleaning up old containers and images..."
docker rm -f iazi-be-test 2>/dev/null || true
docker rmi -f iazi-be:latest 2>/dev/null || true

# Build the Docker image
echo "Building Docker image with optimized settings..."
docker build --memory=2g --memory-swap=2g -t iazi-be:latest .

# Check build result
if [ $? -ne 0 ]; then
  echo "❌ Docker build failed!"
  exit 1
fi

echo "✅ Docker build successful!"

# Run a test container
echo "Starting test container..."
docker run --name iazi-be-test -d -p 3002:3002 iazi-be:latest

# Wait for container to start
echo "Waiting for container to start..."
sleep 5

# Check if container is running
CONTAINER_STATUS=$(docker inspect --format='{{.State.Status}}' iazi-be-test 2>/dev/null || echo "not_found")
if [ "$CONTAINER_STATUS" = "running" ]; then
  echo "✅ Container is running!"
  
  # Check if application responds
  if curl -s http://localhost:3002/api/health | grep -q "ok"; then
    echo "✅ Application health check passed!"
  else
    echo "⚠️ Application health check failed!"
  fi
else
  echo "❌ Container failed to start!"
  docker logs iazi-be-test
fi

# Clean up
echo "Cleaning up..."
docker rm -f iazi-be-test 2>/dev/null || true

echo "=== Build and Test Complete ==="
exit 0
