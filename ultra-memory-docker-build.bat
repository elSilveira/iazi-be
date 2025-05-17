@echo off
setlocal enabledelayedexpansion

echo ===== Ultra Memory-Optimized Docker Build =====

REM Set environment variables for memory optimization
set NODE_OPTIONS=--max-old-space-size=512 --expose-gc --gc-global
set DOCKER_BUILDKIT=1

echo Attempting build with ultra-low memory configuration...
docker build ^
  --memory=2g ^
  --memory-swap=2g ^
  --build-arg NODE_OPTIONS="--max-old-space-size=512 --expose-gc --gc-global" ^
  --build-arg NPM_CONFIG_LOGLEVEL=error ^
  --build-arg NPM_CONFIG_AUDIT=false ^
  --build-arg NPM_CONFIG_FUND=false ^
  --build-arg NPM_CONFIG_OPTIONAL=false ^
  --build-arg NPM_CONFIG_PROGRESS=false ^
  -t iazi-be-test .

if %ERRORLEVEL% == 0 (
  echo ===== Build Successful! =====
  echo The image was built with ultra memory optimizations.
  echo.
  echo To test the image locally:
  echo docker run -p 3002:3002 --env-file .env iazi-be-test
  echo.
  echo To deploy to Railway:
  echo railway up
) else (
  echo ===== Build Failed! =====
  echo Attempting even more extreme memory settings...
  echo.
  
  echo Building with no-cache and extreme memory limits...
  docker build ^
    --no-cache ^
    --memory=2g ^
    --memory-swap=2g ^
    --build-arg NODE_OPTIONS="--max-old-space-size=256 --expose-gc --gc-global" ^
    --build-arg NPM_CONFIG_LOGLEVEL=error ^
    --build-arg NPM_CONFIG_AUDIT=false ^
    --build-arg NPM_CONFIG_FUND=false ^
    --build-arg NPM_CONFIG_OPTIONAL=false ^
    --build-arg NPM_CONFIG_PROGRESS=false ^
    -t iazi-be-test .
  
  if %ERRORLEVEL% == 0 (
    echo ===== Second Build Attempt Successful! =====
    echo The image was built with extreme memory optimizations.
    echo.
    echo To test the image locally:
    echo docker run -p 3002:3002 --env-file .env iazi-be-test
    echo.
    echo To deploy to Railway:
    echo railway up
  ) else (
    echo ===== All Build Attempts Failed =====
    echo Please see EXTREME-MEMORY-OPTIMIZATION.md for manual steps.
  )
)
