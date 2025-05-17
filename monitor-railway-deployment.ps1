# Monitor Railway deployment and check status
Write-Host "======== Railway Deployment Monitor ========" -ForegroundColor Green

# Check deployment status
Write-Host "Checking deployment status..." -ForegroundColor Cyan
try {
    railway status
} catch {
    Write-Host "❌ Failed to get Railway status. Make sure you're logged in." -ForegroundColor Red
    Write-Host "   Run 'railway login' first." -ForegroundColor Yellow
    exit 1
}

# Function to check logs with optional filtering
function Check-Logs {
    param(
        [string]$filter = ""
    )
    
    if ($filter) {
        Write-Host "Checking logs with filter: $filter..." -ForegroundColor Cyan
        railway logs --filter $filter
    } else {
        Write-Host "Checking recent logs..." -ForegroundColor Cyan
        railway logs --limit 50
    }
}

# Check recent logs
Check-Logs

# Menu options
Write-Host "`n======== Monitoring Options ========" -ForegroundColor Green
Write-Host "1. Watch logs in real-time" -ForegroundColor Cyan
Write-Host "2. Check for error logs" -ForegroundColor Cyan
Write-Host "3. Check healthcheck status" -ForegroundColor Cyan
Write-Host "4. Check npm installation logs" -ForegroundColor Cyan
Write-Host "5. Exit" -ForegroundColor Cyan

$option = Read-Host "Choose an option (1-5)"

switch ($option) {
    "1" { railway logs --follow }
    "2" { Check-Logs "error" }
    "3" { railway logs --filter "healthcheck" }
    "4" { railway logs --filter "npm" }
    "5" { exit 0 }
    default { Write-Host "Invalid option. Exiting." -ForegroundColor Yellow }
}

Write-Host "To continue monitoring, run this script again." -ForegroundColor Green
