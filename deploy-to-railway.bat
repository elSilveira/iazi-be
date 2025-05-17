@echo off
echo ===== Deploying to Railway with Simplified Configuration =====
echo Running deployment...
railway up

if %ERRORLEVEL% == 0 (
    echo ===== Deployment initiated! =====
    echo.
    echo To monitor the deployment, use:
    echo railway status
    echo.
    echo To check logs after deployment:
    echo railway logs
) else (
    echo ===== Deployment Failed! =====
    echo Please check the error messages above.
)
