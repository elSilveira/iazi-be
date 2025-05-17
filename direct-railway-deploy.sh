#!/bin/sh
# direct-railway-deploy.sh
# Ultra-simplified script to deploy to Railway using direct Node.js approach

echo "=== DIRECT RAILWAY DEPLOY ==="
echo "This script deploys using the direct Node.js approach to avoid shell script issues"

# Check if Railway CLI is installed
if ! command -v railway >/dev/null 2>&1; then
    echo "Railway CLI not installed. Please install it with 'npm i -g @railway/cli'"
    exit 1
fi

# Copy our direct approach files to make them the defaults
echo "Setting up direct approach files..."
cp railway-direct.json railway.json
cp Dockerfile.direct Dockerfile

# Login to Railway if needed
railway login

# Deploy to Railway
echo "Deploying to Railway..."
railway up

# Monitor the deployment
echo "Deployment initiated. Monitoring logs..."
railway logs
