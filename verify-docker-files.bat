@echo off
echo === Docker Build Files Verification ===
echo This script will check if all required files for Docker build exist.

echo Checking necessary files...
set MISSING_FILES=0

call :check_file "Dockerfile" "Main Dockerfile"
call :check_file "comprehensive-ts-build.sh" "TypeScript build script"
call :check_file "emergency-build-ultra.sh" "Emergency build script"
call :check_file "diagnose-ts-errors.sh" "TypeScript diagnostic script"
call :check_file "fix-permissions.sh" "Permissions fix script"
call :check_file "docker-memory-optimize.sh" "Memory optimization script"
call :check_file "healthcheck.sh" "Health check script"
call :check_file "deployment-diagnostics.js" "Deployment diagnostics"
call :check_file "tsconfig.docker.json" "Docker TypeScript config"
call :check_file "package.json" "NPM package file"

if %MISSING_FILES% GTR 0 (
  echo [33mWarning: %MISSING_FILES% files are missing. Docker build will likely fail.[0m
  echo Please make sure all required files are present before building the Docker image.
) else (
  echo [32mAll required files are present. Dockerfile should build successfully.[0m
)

echo.
echo === Docker Build Prerequisites ===
echo To build the Docker image, you need:

echo 1. Docker Desktop or Docker CLI installed
where docker >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo    [32m√ Docker is installed[0m
) else (
  echo    [31m× Docker not found - please install Docker[0m
)

echo 2. At least 2GB of available memory for Docker
echo 3. Internet connection to download Node.js base image and npm packages

echo.
echo === Verification Complete ===
pause
exit /b 0

:check_file
if not exist "%~1" (
  echo [31m× Missing: %~1 - %~2[0m
  set /a MISSING_FILES=%MISSING_FILES%+1
) else (
  echo [32m√ Found: %~1[0m
)
exit /b 0
