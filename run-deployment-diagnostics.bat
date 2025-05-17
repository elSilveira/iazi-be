@echo off
echo Running Railway Deployment Diagnostics...

set RAILWAY_PROJECT=iazi-api
set DIAGNOSTICS_COMMAND=node deployment-diagnostics.js

echo.
echo === CONNECTING TO RAILWAY DEPLOYMENT ===
npx @railway/cli run --service $RAILWAY_PROJECT %DIAGNOSTICS_COMMAND%

echo.
echo === DIAGNOSTICS COMPLETE ===
echo If this fails, ensure you're logged in to Railway CLI with: npx @railway/cli login
echo You can view Railway logs with: npx @railway/cli logs
