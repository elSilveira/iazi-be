# Resolving Docker Build Error Codes 137 and 1

This guide addresses the specific error codes you're encountering during Docker builds:
- **Exit Code 137**: Process terminated due to out-of-memory condition
- **Exit Code 1**: Generic failure (often caused by memory constraints in npm installation)

## Quick Fix Steps

1. Try the progressive build script:
   ```powershell
   .\try-multiple-docker-builds.ps1
   ```

2. If that fails, try manually with:
   ```powershell
   docker build -t iazi-be-test --memory=4g --memory-swap=4g --no-cache .
   ```

## Detailed Analysis of Exit Code 137

Exit code 137 indicates that the process was terminated by the kernel because it exceeded the memory limits. This happens specifically during the npm installation process.

### Causes:
1. Node.js heap size exceeds container memory
2. npm dependency installation requires too much memory
3. Parallel operations during installation

### Solutions Implemented:
1. Set max old space size for Node.js V8 engine:
   ```
   NODE_OPTIONS="--max-old-space-size=2048"
   ```

2. Split npm installation into multiple steps:
   ```dockerfile
   RUN npm install --only=production --ignore-scripts
   RUN npm rebuild
   ```

3. Reduced npm verbosity:
   - Removed `--loglevel verbose`
   - Added `NPM_CONFIG_LOGLEVEL=error`

## Detailed Analysis of Exit Code 1

Exit code 1 is a generic failure code that can have multiple causes. In our case, it's associated with npm installation failures.

### Causes:
1. Network connectivity issues
2. Package compatibility problems
3. Memory constraints (but not severe enough for OOM killer)
4. Script execution failures

### Solutions Implemented:
1. Added npm configuration:
   ```
   NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
   NPM_CONFIG_PREFER_OFFLINE=true
   ```

2. Used `--ignore-scripts` flag to skip potentially memory-intensive scripts during initial installation

3. Added a more robust retry mechanism in Dockerfile

## Railway-Specific Considerations

Railway has specific constraints that may differ from your local environment:

1. Memory limits may be stricter
2. CPU allocation may be different
3. Network conditions may vary

To accommodate these constraints, we've:
1. Increased healthcheck timeouts to 20s
2. Added restart policy with max retries
3. Optimized the Docker context with better .dockerignore

## Testing the Deployment

After successfully building with one of the optimized approaches:

1. Deploy to Railway:
   ```powershell
   .\deploy-to-railway.bat
   ```

2. Monitor the deployment:
   ```powershell
   .\monitor-railway-deployment.ps1
   ```

## If All Else Fails

If none of the optimized approaches work, consider:

1. Reducing your dependency footprint:
   - Check for unused dependencies
   - Look for alternatives to memory-intensive packages

2. Using a pre-built node_modules approach:
   - Build node_modules locally
   - Include them in a custom base image

3. Contact Railway support about memory limits for your project
