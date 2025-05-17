@echo off
echo Building Docker image with fixed script permissions...

REM Ensure the fix-permissions.sh script has Unix line endings 
powershell -Command "(Get-Content -Raw fix-permissions.sh) -replace \"`r`n\", \"`n\" | Set-Content -NoNewline fix-permissions.sh"

REM Ensure the docker-typescript-build.sh script has Unix line endings
powershell -Command "(Get-Content -Raw docker-typescript-build.sh) -replace \"`r`n\", \"`n\" | Set-Content -NoNewline docker-typescript-build.sh"

REM Build Docker image with no cache to ensure all fixes are applied
docker build -t iazi-be-fixed-permissions . --no-cache

if %ERRORLEVEL% NEQ 0 (
  echo Docker build failed. See error messages above.
  exit /b %ERRORLEVEL%
)

echo Docker build succeeded! The script permission issue has been fixed.
echo You can now deploy to Railway with: deploy-to-railway-with-ts-fix.bat

echo.
echo Note: This build fixes script permission issues in the Docker environment.
