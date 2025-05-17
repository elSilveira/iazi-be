# Pre-deployment requirements check for Docker and Railway
Write-Host "======== Pre-deployment Requirements Check ========" -ForegroundColor Green

# Check Docker installation
Write-Host "Checking Docker installation..." -ForegroundColor Cyan
$dockerVersion = $null
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not in PATH. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check Railway CLI installation
Write-Host "Checking Railway CLI installation..." -ForegroundColor Cyan
$railwayVersion = $null
try {
    $railwayVersion = railway version
    Write-Host "✅ Railway CLI is installed: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI is not installed or not in PATH." -ForegroundColor Red
    Write-Host "   Install with: npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

# Check package.json
Write-Host "Checking package.json configuration..." -ForegroundColor Cyan
if (Test-Path "package.json") {
    $package = Get-Content "package.json" | ConvertFrom-Json
    
    # Check if bcrypt is in dependencies (not devDependencies)
    if ($package.dependencies.bcrypt) {
        Write-Host "✅ bcrypt is correctly in dependencies" -ForegroundColor Green
    } else {
        Write-Host "❌ bcrypt is missing from dependencies. It should be moved from devDependencies." -ForegroundColor Red
        exit 1
    }
    
    # Check if build script exists
    if ($package.scripts.build) {
        Write-Host "✅ build script exists in package.json" -ForegroundColor Green
    } else {
        Write-Host "❌ build script is missing from package.json" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ package.json not found!" -ForegroundColor Red
    exit 1
}

# Check if Dockerfile exists
Write-Host "Checking Dockerfile..." -ForegroundColor Cyan
if (Test-Path "Dockerfile") {
    Write-Host "✅ Dockerfile exists" -ForegroundColor Green
} else {
    Write-Host "❌ Dockerfile not found!" -ForegroundColor Red
    exit 1
}

# Check if railway.json exists
Write-Host "Checking railway.json..." -ForegroundColor Cyan
if (Test-Path "railway.json") {
    Write-Host "✅ railway.json exists" -ForegroundColor Green
} else {
    Write-Host "❌ railway.json not found!" -ForegroundColor Red
    exit 1
}

Write-Host "======== All requirements passed! ========" -ForegroundColor Green
Write-Host "Ready to run: .\test-docker-build.bat" -ForegroundColor Cyan
