Write-Host "===== Testing Docker Build with Progressive Memory Optimizations =====" -ForegroundColor Green

$buildAttempts = @(
    @{
        Name = "Standard build with memory limits"
        Command = "docker build -t iazi-be-test -f Dockerfile ."
    },
    @{
        Name = "Build with memory optimization flags"
        Command = "docker build -t iazi-be-test -f Dockerfile --memory=4g --memory-swap=4g ."
    },
    @{
        Name = "Build with staged approach"
        Command = "docker build -t iazi-be-test -f Dockerfile --build-arg NODE_OPTIONS=`"--max-old-space-size=2048`" ."
    },
    @{
        Name = "Build with final fallback"
        Command = "docker build -t iazi-be-test -f Dockerfile --no-cache --build-arg NODE_OPTIONS=`"--max-old-space-size=1024`" ."
    }
)

$buildSuccess = $false

foreach ($attempt in $buildAttempts) {
    if (-not $buildSuccess) {
        Write-Host "`n>> Attempt: $($attempt.Name)" -ForegroundColor Cyan
        Write-Host "Running: $($attempt.Command)" -ForegroundColor Yellow
        
        Invoke-Expression $attempt.Command
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ BUILD SUCCESSFUL!" -ForegroundColor Green
            Write-Host "The Docker image was built successfully with: $($attempt.Name)" -ForegroundColor Green
            $buildSuccess = $true
            
            Write-Host "`nTo test running the container locally, use:"
            Write-Host "docker run -p 3002:3002 --env-file .env iazi-be-test" -ForegroundColor Cyan
            
            Write-Host "`nTo deploy to Railway, use:"
            Write-Host "railway up" -ForegroundColor Cyan
            
            break
        } else {
            Write-Host "❌ Build failed with: $($attempt.Name)" -ForegroundColor Red
            Write-Host "Trying next approach..." -ForegroundColor Yellow
        }
    }
}

if (-not $buildSuccess) {
    Write-Host "`n❌ ALL BUILD ATTEMPTS FAILED" -ForegroundColor Red
    Write-Host "Please check DOCKER-MEMORY-OPTIMIZATIONS.md for manual troubleshooting steps." -ForegroundColor Yellow
}
