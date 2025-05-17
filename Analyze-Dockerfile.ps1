Write-Host "=== Dockerfile Content Analysis ===" -ForegroundColor Cyan

if (-not (Test-Path "Dockerfile")) {
    Write-Host "ERROR: Dockerfile not found!" -ForegroundColor Red
    exit 1
}

$dockerfileContent = Get-Content -Path "Dockerfile" -Raw

# Check for key sections
$builderStage = $dockerfileContent -match "FROM node:18-alpine AS builder"
$runtimeStage = $dockerfileContent -match "FROM node:18-alpine AS runtime"
$typescriptBuild = $dockerfileContent -match "comprehensive-ts-build.sh"
$emergencyBuild = $dockerfileContent -match "emergency-build-ultra.sh"
$healthcheck = $dockerfileContent -match "HEALTHCHECK"

Write-Host "`nChecking Dockerfile sections:"
Write-Host "- Builder stage defined: $(if ($builderStage) { "✅ Yes" } else { "❌ No" })"
Write-Host "- Runtime stage defined: $(if ($runtimeStage) { "✅ Yes" } else { "❌ No" })"
Write-Host "- TypeScript build script referenced: $(if ($typescriptBuild) { "✅ Yes" } else { "❌ No" })"
Write-Host "- Emergency build script referenced: $(if ($emergencyBuild) { "✅ Yes" } else { "❌ No" })"
Write-Host "- Healthcheck defined: $(if ($healthcheck) { "✅ Yes" } else { "❌ No" })"

Write-Host "`nChecking referenced scripts:"
$scriptsToCheck = @(
    "comprehensive-ts-build.sh",
    "emergency-build-ultra.sh",
    "diagnose-ts-errors.sh",
    "fix-permissions.sh",
    "docker-memory-optimize.sh",
    "healthcheck.sh"
)

foreach ($script in $scriptsToCheck) {
    if (Test-Path $script) {
        Write-Host "- $script: ✅ Found"
    } else {
        Write-Host "- $script: ❌ Missing" -ForegroundColor Red
    }
}

Write-Host "`n=== Analysis Complete ===`n"

# Print Docker status
try {
    $dockerVersion = docker --version
    Write-Host "Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "Docker is NOT installed or not in PATH" -ForegroundColor Red
    Write-Host "You need to install Docker to build the image" -ForegroundColor Yellow
}

Write-Host "`nTo build the Docker image when Docker is installed, run:"
Write-Host "docker build -t iazi-be:latest ." -ForegroundColor Cyan

Read-Host "`nPress Enter to exit"
