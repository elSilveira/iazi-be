#!/bin/bash
set -e

echo "===== Deploying to Railway with Simplified Configuration ====="
echo "Running deployment..."
railway up

echo "===== Deployment initiated! ====="
echo ""
echo "To monitor the deployment, use:"
echo "railway status"
echo ""
echo "To check logs after deployment:"
echo "railway logs"
