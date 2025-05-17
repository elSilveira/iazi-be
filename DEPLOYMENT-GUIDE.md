# Docker and Railway Deployment Guide

This guide explains the optimized Docker configuration and Railway deployment process for this Node.js/Express/Prisma application.

## Quick Start

Follow these steps to quickly deploy the application:

1. Verify requirements:
   ```powershell
   .\check-deployment-requirements.ps1
   ```

2. Test the Docker build locally:
   ```powershell
   .\test-docker-build.bat
   ```

3. Deploy to Railway:
   ```powershell
   .\deploy-to-railway.bat
   ```

4. Monitor the deployment:
   ```powershell
   .\monitor-railway-deployment.ps1
   ```

## Docker Build Configuration

The Docker build has been simplified to address npm installation issues:

1. The multi-stage build approach has been preserved:
   - Stage 1 (Builder): Installs dependencies and builds the TypeScript application
   - Stage 2 (Runner): Creates a minimal production container

2. Key Improvements:
   - Simplified npm installation process
   - Removed complex commands that might not be available in Railway's environment
   - Used `npm ci` with fallback to `npm install` for better reliability
   - Maintained core functionality while reducing complexity
   - Increased healthcheck timeout for better reliability

## Understanding Railway Deployment

Railway uses the following configuration files:

1. **railway.json** - Contains deployment configuration including:
   - Build and start commands
   - Healthcheck paths and timeouts
   - Restart policies

2. **Dockerfile** - Defines how the application is built and run

3. **railway-build.bat** - Custom Windows build script for Railway

## Common Deployment Issues and Solutions

### 1. Memory-Related Failures (Exit Code 137)

This error indicates the build process ran out of memory.

**Solution:**
- Simplify the npm installation process
- Reduce parallel operations during build
- Increase memory allocation in Railway settings

### 2. Command Not Found Errors (Exit Code 127)

This error occurs when a command is not available in the build environment.

**Solution:**
- Remove complex commands (like ping)
- Ensure all required tools are installed in the Docker image
- Use basic Alpine packages only

### 3. npm Installation Failures

**Solution:**
- Ensure bcrypt is in dependencies (not devDependencies)
- Use simplified .npmrc configuration
- Implement fallback installation options

## Monitoring and Troubleshooting

After deployment, use these commands to monitor the application:

```powershell
# Check deployment status
railway status

# View recent logs
railway logs

# Monitor logs in real-time
railway logs --follow

# View only error logs
railway logs --filter "error"
```

For more detailed monitoring, use:
```powershell
.\monitor-railway-deployment.ps1
```
