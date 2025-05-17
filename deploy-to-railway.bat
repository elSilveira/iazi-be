@echo off
setlocal enabledelayedexpansion

echo ===== Deploying to Railway with Advanced Memory Optimizations =====

echo Setting environment variables for Railway deployment...
set RAILWAY_NODE_OPTIONS=--max-old-space-size=2048
set RAILWAY_NPM_CONFIG_LOGLEVEL=error
set RAILWAY_NPM_CONFIG_AUDIT=false
set RAILWAY_NPM_CONFIG_FUND=false

echo Verifying project status before deployment...
railway status
if %ERRORLEVEL% NEQ 0 (
    echo ===== Railway project not linked or CLI not installed =====
    echo Running railway login and linking project...
    railway login
    railway link
)

echo Running deployment with memory optimizations...
railway up

if %ERRORLEVEL% == 0 (
    echo ===== Deployment initiated! =====
    echo.
    echo Waiting 30 seconds for deployment to progress...
    timeout /t 30 /nobreak > nul
    
    echo Checking deployment status...
    railway status
    
    echo.
    echo Checking initial logs...
    railway logs --limit 20
    
    echo.
    echo To monitor the deployment in detail, use:
    echo .\monitor-railway-deployment.ps1
) else (
    echo ===== Deployment Failed! =====
    echo.
    echo Please check the following:
    echo 1. Docker build issues: Review DOCKER-BUILD-ERROR-FIXES.md
    echo 2. Railway connection: Try 'railway login' again
    echo 3. Project configuration: Verify railway.json settings
    echo.
    echo For detailed troubleshooting steps, see DOCKER-MEMORY-OPTIMIZATIONS.md
)
