# Docker Memory Optimization Guide

This document explains the memory optimizations made to fix npm installation issues in Docker.

## Memory-Related Errors in Docker

When building Docker images, you might encounter these memory-related errors:

1. **Exit Code 137**: Process was killed due to out of memory (OOM)
2. **Exit Code 1**: Generic failure that can be caused by memory issues

## Applied Optimizations

### 1. Node.js Memory Limits

We've set explicit memory limits for Node.js:

```dockerfile
NODE_OPTIONS="--max-old-space-size=2048"
```

This limits the V8 JavaScript heap to 2GB, preventing Node.js from consuming all available container memory.

### 2. Staged npm Installation

Instead of using `npm ci` or `npm install` directly, we now:

1. First install without running scripts:
   ```
   npm install --ignore-scripts
   ```

2. Then rebuild only the necessary modules:
   ```
   npm rebuild
   ```

This reduces peak memory usage during installation.

### 3. Reduced npm Verbosity

Removed `--loglevel verbose` flags as they increase memory usage by logging extensive information.

### 4. Optimized npm Flags

Added these flags to reduce memory consumption:
- `--no-audit`: Skips the security audit
- `--no-fund`: Skips funding messages
- `--ignore-scripts`: Prevents running install scripts in the first phase

### 5. Docker Build Parameters

When building locally, we use:
```
docker build --memory=4g --memory-swap=4g
```

This allocates sufficient memory for the build process.

## Railway-Specific Optimizations

1. **Increased Healthcheck Timeouts**: From 15s to 20s to accommodate slower startups
2. **Cross-Platform Build Commands**: Supports both Linux and Windows environments
3. **Simplified Build Scripts**: Reduced complexity in railway-build.sh and railway-build.bat

## Testing the Optimizations

Use the new optimized test script:
```
test-docker-build-optimized.bat
```

This script includes fallback mechanisms for building with memory constraints.

## Monitoring Memory Usage

To monitor memory usage during builds:
1. On Linux: Use `docker stats`
2. On Windows: Use Docker Desktop's built-in monitoring

## Further Troubleshooting

If memory issues persist:
1. Analyze your dependencies to identify memory-intensive packages
2. Consider further splitting the build process
3. Increase the memory allocated to Docker in Docker Desktop settings
