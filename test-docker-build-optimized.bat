@echo off
echo ===== Testing Docker Build with Memory-Optimized Configuration =====

echo Building Docker image with memory optimization flags...
docker build -t iazi-be-test --memory=4g --memory-swap=4g .

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
    echo.
    echo Trying with reduced workload and increased memory...
    echo.
    docker build -t iazi-be-test --memory=4g --memory-swap=4g --build-arg NODE_OPTIONS="--max-old-space-size=2048" .
    
    if %ERRORLEVEL% == 0 (
        echo ===== Second build attempt succeeded! =====
    ) else (
        echo ===== All build attempts failed =====
        echo Please check the error messages above.
    )
)
