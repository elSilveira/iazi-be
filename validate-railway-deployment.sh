#!/bin/bash
set -e

# Post-deployment validation script for Railway

echo "🔍 Validating Railway deployment..."

# Check application status
echo "Checking deployment status..."
railway status

# Get application URL
echo "Getting application URL..."
APP_URL=$(railway variables get RAILWAY_PUBLIC_DOMAIN 2>/dev/null)
if [ -z "$APP_URL" ]; then
    echo "⚠️ Could not determine application URL"
    echo "Please check the Railway dashboard for the URL"
else
    echo "📡 Application deployed at: $APP_URL"
    
    # Check health endpoint
    echo "Testing health endpoint..."
    HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://$APP_URL/api/health" || echo "Failed")
    
    if [ "$HEALTH_RESPONSE" == "200" ]; then
        echo "✅ Health check passed!"
    else
        echo "⚠️ Health check returned: $HEALTH_RESPONSE"
        echo "Checking application logs for errors..."
        railway logs --filter "error" --limit 20
    fi
fi

# Check resource usage
echo "Checking resource usage..."
railway logs --filter "memory" --limit 10

echo "Check Railway dashboard for more detailed metrics."
echo "🏁 Validation complete!"
