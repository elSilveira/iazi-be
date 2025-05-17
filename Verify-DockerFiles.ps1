# Docker Build Files Verification Script
Write-Host "=== Docker Build Files Verification ===" -ForegroundColor Cyan
Write-Host "This script will check if all required files for Docker build exist." -ForegroundColor White

Write-Host "`nChecking necessary files..." -ForegroundColor Cyan
$missingFiles = 0

function Check-File {
    param (
        [string]$fileName,
        [string]$description
    )
    
    if (Test-Path -Path $fileName) {
        Write-Host "✅ Found: $fileName" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Missing: $fileName - $description" -ForegroundColor Red
        return $false
    }
}

$filesToCheck = @(
    @{Name="Dockerfile"; Description="Main Dockerfile"},
    @{Name="comprehensive-ts-build.sh"; Description="TypeScript build script"},
    @{Name="emergency-build-ultra.sh"; Description="Emergency build script"},
    @{Name="diagnose-ts-errors.sh"; Description="TypeScript diagnostic script"},
    @{Name="fix-permissions.sh"; Description="Permissions fix script"},
    @{Name="docker-memory-optimize.sh"; Description="Memory optimization script"},
    @{Name="healthcheck.sh"; Description="Health check script"},
    @{Name="deployment-diagnostics.js"; Description="Deployment diagnostics"},
    @{Name="tsconfig.docker.json"; Description="Docker TypeScript config"},
    @{Name="package.json"; Description="NPM package file"}
)

foreach ($file in $filesToCheck) {
    if (-not (Check-File -fileName $file.Name -description $file.Description)) {
        $missingFiles++
    }
}

if ($missingFiles -gt 0) {
    Write-Host "`nWarning: $missingFiles files are missing. Docker build will likely fail." -ForegroundColor Yellow
    Write-Host "Please make sure all required files are present before building the Docker image." -ForegroundColor Yellow
} else {
    Write-Host "`nAll required files are present. Dockerfile should build successfully." -ForegroundColor Green
}

Write-Host "`n=== Docker Build Prerequisites ===" -ForegroundColor Cyan
Write-Host "To build the Docker image, you need:" -ForegroundColor White

Write-Host "`n1. Docker Desktop or Docker CLI installed" -ForegroundColor White
try {
    $dockerVersion = docker --version
    Write-Host "   ✅ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Docker not found - please install Docker" -ForegroundColor Red
}

Write-Host "2. At least 2GB of available memory for Docker" -ForegroundColor White
Write-Host "3. Internet connection to download Node.js base image and npm packages" -ForegroundColor White

Write-Host "`n=== Verification Complete ===" -ForegroundColor Cyan
Read-Host -Prompt "Press Enter to exit"
