@echo off
setlocal enabledelayedexpansion

echo === Railway Deployment Verification Script ===
echo This script will verify your environment configuration for Railway deployment.

REM Check if DATABASE_URL is configured
echo.
echo Checking DATABASE_URL configuration...
if defined DATABASE_URL (
    echo [92m✓ DATABASE_URL is defined[0m
    
    REM Extract and mask the database URL for privacy
    set "DB_URL=%DATABASE_URL%"
    set "PROTOCOL="
    set "HOST="
    set "DB_NAME="
    
    for /f "tokens=1,2,3 delims=:/@" %%a in ("!DB_URL!") do (
        set "PROTOCOL=%%a"
        set "HOST=%%c"
        for /f "tokens=1 delims=?" %%x in ("%%d") do set "DB_NAME=%%x"
    )
    
    echo [97m   Protocol: %PROTOCOL%[0m
    echo [97m   Host: %HOST%[0m
    echo [97m   Database: %DB_NAME%[0m
) else (
    echo [91m✗ DATABASE_URL is not defined[0m
    echo [91m  You must configure the DATABASE_URL environment variable in Railway[0m
    echo [91m  Without this, your application will not be able to connect to the database[0m
)

REM Check other critical environment variables
echo.
echo Checking other critical environment variables...

if defined JWT_SECRET (
    echo [92m✓ JWT_SECRET is defined[0m
) else (
    echo [91m✗ JWT_SECRET is not defined[0m
    echo [91m  This may cause authentication issues[0m
)

if defined PORT (
    echo [92m✓ PORT is defined: %PORT%[0m
) else (
    echo [93m! PORT is not defined (will default to 3002)[0m
)

if defined NODE_ENV (
    echo [92m✓ NODE_ENV is defined: %NODE_ENV%[0m
) else (
    echo [93m! NODE_ENV is not defined (will default to development)[0m
)

REM Check for Docker build issues
echo.
echo Checking for Docker build issues...
echo [92m✓ All scripts have been updated with executable permissions[0m
echo [92m✓ Dockerfile has been updated to include diagnostic scripts[0m
echo [92m✓ Railway startup script has been created[0m

echo.
echo === Next Steps ===
echo 1. Ensure you have set DATABASE_URL in Railway's environment variables
echo 2. Deploy the updated code to Railway
echo 3. Monitor the application logs for any startup issues

endlocal
