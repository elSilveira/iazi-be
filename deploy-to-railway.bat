@echo off
setlocal enabledelayedexpansion

echo ===== Deploying to Railway with Extreme Memory Optimizations =====

echo Setting environment variables for Railway deployment...
set RAILWAY_NODE_OPTIONS=--max-old-space-size=512 --expose-gc --gc-global
set RAILWAY_NPM_CONFIG_LOGLEVEL=error
set RAILWAY_NPM_CONFIG_AUDIT=false
set RAILWAY_NPM_CONFIG_FUND=false
set RAILWAY_NPM_CONFIG_OPTIONAL=false
set RAILWAY_NPM_CONFIG_PROGRESS=false
set RAILWAY_PRISMA_CLI_MEMORY_MIN=64
set RAILWAY_PRISMA_CLI_MEMORY_MAX=512

echo Verifying project status before deployment...
railway status
if %ERRORLEVEL% NEQ 0 (
    echo ===== Railway project not linked or CLI not installed =====
    echo Running railway login and linking project...
    railway login
    railway link
)

echo Running deployment with extreme memory optimizations...
railway up

if %ERRORLEVEL% == 0 (
    echo ===== Deployment initiated! =====
    echo.
    echo Waiting 45 seconds for deployment to progress...
    timeout /t 45 /nobreak > nul
    
    echo Checking deployment status...
    railway status
    
    echo.
    echo Checking initial logs...
    railway logs --limit 20
    
    echo.
    echo To monitor the deployment in detail, use:
    echo .\monitor-railway-deployment.ps1
    
    echo.
    echo If deployment fails, try:
    echo 1. .\ultra-memory-docker-build.bat
    echo 2. .\prebuilt-docker-build.bat (last resort)
) else (
    echo ===== Deployment Failed! =====
    echo.
    echo Please check the following:
    echo 1. Docker build issues: Review EXTREME-MEMORY-OPTIMIZATION.md
    echo 2. Try the ultra-optimized build: .\ultra-memory-docker-build.bat
    echo 3. Last resort: .\prebuilt-docker-build.bat
    echo.
    echo For detailed troubleshooting steps, see EXTREME-MEMORY-OPTIMIZATION.md
)
