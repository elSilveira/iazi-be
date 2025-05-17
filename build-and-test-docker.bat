@echo off
echo === Building and Testing Docker Image ===

REM Check if Docker is installed
where docker >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo [31mError: Docker is not installed or not in your PATH.[0m
  echo Please install Docker Desktop or Docker CLI and try again.
  pause
  exit /b 1
)

REM Set memory limits for Docker build
set DOCKER_BUILDKIT=1
set DOCKER_CLI_EXPERIMENTAL=enabled

REM Clean up any old containers and images
echo Cleaning up old containers and images...
docker rm -f iazi-be-test >nul 2>&1
docker rmi -f iazi-be:latest >nul 2>&1

REM Build the Docker image
echo Building Docker image with optimized settings...
docker build --memory=2g --memory-swap=2g -t iazi-be:latest .

REM Check build result
if %ERRORLEVEL% NEQ 0 (
  echo [31m× Docker build failed![0m
  exit /b 1
)

echo [32m√ Docker build successful![0m

REM Run a test container
echo Starting test container...
docker run --name iazi-be-test -d -p 3002:3002 iazi-be:latest

REM Wait for container to start
echo Waiting for container to start...
timeout /t 5 >nul

REM Check if container is running
docker inspect --format="{{.State.Status}}" iazi-be-test >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo [32m√ Container is running![0m
  
  REM Check if application responds
  curl -s http://localhost:3002/api/health >health_response.txt
  findstr "ok" health_response.txt >nul
  if %ERRORLEVEL% EQU 0 (
    echo [32m√ Application health check passed![0m
    del health_response.txt
  ) else (
    echo [33m! Application health check failed![0m
    del health_response.txt
  )
) else (
  echo [31m× Container failed to start![0m
  docker logs iazi-be-test
)

REM Clean up
echo Cleaning up...
docker rm -f iazi-be-test >nul 2>&1

echo === Build and Test Complete ===
pause
exit /b 0
