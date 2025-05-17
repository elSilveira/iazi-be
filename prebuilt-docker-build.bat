@echo off
echo ===== Preparing Pre-built node_modules Docker Build =====

echo This is a last resort approach for when all optimization attempts fail.
echo It will build node_modules locally and then use them in the Docker build.

echo Creating build context directory...
if exist docker-build-context rmdir /s /q docker-build-context
mkdir docker-build-context

echo Installing dependencies locally...
call npm install

echo Rebuilding bcrypt...
call npm rebuild bcrypt

echo Building TypeScript...
call npm run build

echo Copying files to build context...
xcopy /E /I /Y node_modules docker-build-context\node_modules
xcopy /E /I /Y dist docker-build-context\dist
copy package*.json docker-build-context\
xcopy /E /I /Y prisma docker-build-context\prisma

echo Building Docker image with pre-built files...
docker build -t iazi-be-test -f Dockerfile.prebuilt .

if %ERRORLEVEL% == 0 (
  echo ===== Pre-built Docker Build Successful! =====
  echo The image was built using locally built node_modules.
  echo.
  echo To test the image locally:
  echo docker run -p 3002:3002 --env-file .env iazi-be-test
  echo.
  echo To deploy to Railway:
  echo railway up
) else (
  echo ===== Pre-built Docker Build Failed =====
  echo Please check the error messages above.
)
