@echo off
echo Building Docker image with new comprehensive TypeScript fixes...

REM Clean any previous builds
echo Cleaning previous builds...
docker system prune -f

REM Build the Docker image with the improved scripts
echo Building Docker image...
docker build -t iazi-be-fixed-typescript:latest .

if %ERRORLEVEL% NEQ 0 (
  echo Error: Docker build failed with exit code %ERRORLEVEL%
  exit /b %ERRORLEVEL%
)

echo Docker build successful!
echo Running a test container...

REM Run a test container to verify it works
docker run --rm -p 3002:3002 iazi-be-fixed-typescript:latest

echo Done!
