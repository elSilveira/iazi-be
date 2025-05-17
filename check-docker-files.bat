@echo off
echo === Docker Build Files Check ===
echo.

echo Checking Dockerfile...
if exist "Dockerfile" (
  echo Dockerfile: Found
) else (
  echo Dockerfile: MISSING!
)

echo.
echo Checking build scripts...
if exist "comprehensive-ts-build.sh" (
  echo comprehensive-ts-build.sh: Found
) else (
  echo comprehensive-ts-build.sh: MISSING!
)

if exist "emergency-build-ultra.sh" (
  echo emergency-build-ultra.sh: Found
) else (
  echo emergency-build-ultra.sh: MISSING!
)

if exist "diagnose-ts-errors.sh" (
  echo diagnose-ts-errors.sh: Found
) else (
  echo diagnose-ts-errors.sh: MISSING!
)

echo.
echo Checking if Docker is installed...
where docker >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo Docker: Installed
) else (
  echo Docker: NOT INSTALLED!
)

echo.
echo === Check Complete ===
pause
