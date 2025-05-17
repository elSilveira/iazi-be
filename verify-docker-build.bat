@echo off
echo === Testing Docker Build ===
echo This script will verify that the Dockerfile builds successfully

echo Checking if required files exist...
set MISSING_FILES=0

call :check_file comprehensive-ts-build.sh
call :check_file emergency-build-ultra.sh
call :check_file diagnose-ts-errors.sh
call :check_file fix-permissions.sh
call :check_file docker-memory-optimize.sh
call :check_file healthcheck.sh
call :check_file deployment-diagnostics.js
call :check_file tsconfig.docker.json
call :check_file package.json

if %MISSING_FILES% GTR 0 (
  echo [33mWarning: %MISSING_FILES% files are missing. The Docker build may fail.[0m
  echo Please create these files before building.
) else (
  echo [32mAll required files are present.[0m
)

echo Verifying Docker build... This may take some time.
where docker >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  docker build -t iazi-be-test-build:latest --target builder . 
  if %ERRORLEVEL% EQU 0 (
    echo [32m√ Dockerfile builder stage builds successfully.[0m
    echo Testing full build...
    docker build -t iazi-be-test-build:latest . 
    if %ERRORLEVEL% EQU 0 (
      echo [32m√ Full Dockerfile build successful![0m
    ) else (
      echo [31m× Full Docker build failed.[0m
    )
  ) else (
    echo [31m× Docker builder stage build failed.[0m
  )
) else (
  echo [33mDocker command not found, cannot verify Dockerfile.[0m
)

echo === Test Complete ===
echo If all checks passed, your Dockerfile should build successfully.
pause
exit /b 0

:check_file
if not exist %1 (
  echo [31m× Missing file: %1[0m
  set /a MISSING_FILES=%MISSING_FILES%+1
) else (
  echo [32m√ Found file: %1[0m
)
exit /b 0
