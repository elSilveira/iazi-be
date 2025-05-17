@echo off
echo Testing Docker build with simplified emergency build script...

REM Ensure all scripts have Unix line endings
powershell -Command "Get-ChildItem -Path . -Filter *.sh -Recurse | ForEach-Object { (Get-Content -Raw $_.FullName) -replace \"`r`n\", \"`n\" | Set-Content -NoNewline $_.FullName }"
echo Converted all shell scripts to Unix line endings

REM Build Docker image without cache
echo Building Docker image...
docker build -t iazi-be-test-fixed .

if %ERRORLEVEL% NEQ 0 (
  echo Docker build failed. See error messages above.
  exit /b %ERRORLEVEL%
)

echo.
echo Docker build SUCCEEDED!
echo The script permission and build issues have been fixed.
echo.
echo You can now deploy to Railway with: deploy-to-railway-with-ts-fix.bat
