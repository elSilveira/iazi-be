@echo off
echo ===== Validating Railway Deployment =====

echo.
echo Step 1: Checking deployment status...
railway status

echo.
echo Step 2: Checking application logs...
railway logs --limit 20

echo.
echo Step 3: Checking health endpoint...
echo Attempting to access the health endpoint of your application...
echo (You may need to replace this URL with your actual Railway URL)
echo.

for /f "tokens=*" %%a in ('railway variables get RAILWAY_PUBLIC_DOMAIN 2^>nul') do (
    set DOMAIN=%%a
    echo Found Railway domain: !DOMAIN!
    curl -v https://!DOMAIN!/api/health
)

if %ERRORLEVEL% NEQ 0 (
    echo Failed to get domain automatically. Please check manually.
    echo Try running: railway open
)

echo.
echo Step 4: Deployment Validation Complete
echo.
echo If you see any issues, check:
echo 1. Docker build logs
echo 2. npm installation issues
echo 3. Application startup errors
echo 4. Health check configuration
echo.
echo For detailed troubleshooting, refer to:
echo - NPM-INSTALL-TROUBLESHOOTING.md
echo - DEPLOYMENT-GUIDE.md
