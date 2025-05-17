@echo off
echo Starting Railway Log Monitor...

set RAILWAY_PROJECT=iazi-api

echo.
echo === CONNECTING TO RAILWAY LOGS ===
echo Press Ctrl+C to exit log monitoring
echo.

npx @railway/cli logs

echo.
echo === MONITORING ENDED ===
