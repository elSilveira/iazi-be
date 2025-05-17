@echo off
echo ===== Testing Docker Build with Simplified Configuration =====
echo Building Docker image...
docker build -t iazi-be-test .

if %ERRORLEVEL% == 0 (
    echo ===== Build Completed Successfully! =====
    echo.
    echo To test running the container locally, use:
    echo docker run -p 3002:3002 --env-file .env.local iazi-be-test
    echo.
    echo If the image builds successfully, you can deploy to Railway with:
    echo railway up
) else (
    echo ===== Build Failed! =====
    echo Please check the error messages above.
)
