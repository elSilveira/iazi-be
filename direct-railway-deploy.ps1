# direct-railway-deploy.ps1
# Ultra-simplified script to deploy to Railway using direct Node.js approach

Write-Host "=== DIRECT RAILWAY DEPLOY ===" -ForegroundColor Cyan
Write-Host "This script deploys using the direct Node.js approach to avoid shell script issues" -ForegroundColor Yellow

# Check if Railway CLI is installed
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "Railway CLI not installed. Please install it with 'npm i -g @railway/cli'" -ForegroundColor Red
    exit 1
}

# Copy our direct approach files to make them the defaults
Write-Host "Setting up direct approach files..." -ForegroundColor Green
Copy-Item -Path .\railway-direct.json -Destination .\railway.json -Force
Copy-Item -Path .\Dockerfile.direct -Destination .\Dockerfile -Force

# Login to Railway if needed
railway login

# Deploy to Railway
Write-Host "Deploying to Railway..." -ForegroundColor Cyan
railway up

# Monitor the deployment
Write-Host "Deployment initiated. Monitoring logs..." -ForegroundColor Green
railway logs
