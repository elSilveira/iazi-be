# Extreme Memory Optimization for Docker Builds

This guide outlines extreme memory optimization techniques implemented to resolve persistent memory issues during Docker builds with npm.

## Error Codes & Their Meanings

1. **Exit Code 137**: The process was killed by the OOM (Out of Memory) killer. This happens when a process consumes too much memory.

2. **Exit Code 1**: Generic failure that can have multiple causes. In our context, it's often related to memory issues but not severe enough to trigger the OOM killer.

## Implemented Extreme Memory Optimizations

### 1. Node.js Memory Limit Reduction

We've significantly reduced the Node.js heap size:
```
NODE_OPTIONS="--max-old-space-size=512 --expose-gc --gc-global"
```

The `--expose-gc --gc-global` flags force more aggressive garbage collection.

### 2. Ultra-Targeted Installation

Instead of using broad npm install commands, we now:

1. Skip optional dependencies:
   ```
   NPM_CONFIG_OPTIONAL=false
   ```

2. Disable all progress reporting to reduce I/O:
   ```
   NPM_CONFIG_PROGRESS=false
   ```

3. Skip all install scripts initially:
   ```
   --ignore-scripts
   ```

4. Only rebuild critical native modules:
   ```
   npm rebuild bcrypt
   ```
   Instead of `npm rebuild` (which rebuilds all native modules)

### 3. Prisma Memory Optimization

Added Prisma-specific memory limits:
```
PRISMA_CLI_MEMORY_MIN=64
PRISMA_CLI_MEMORY_MAX=512
```

### 4. Aggressive Cleanup

Added cleanup steps between operations:
```bash
npm cache clean --force
rm -rf /tmp/* ~/.npm
```

### 5. Docker Build Flags

Using memory-constrained Docker builds:
```
docker build --memory=2g --memory-swap=2g
```

## Modified Files

1. **Dockerfile**: Complete redesign with ultra-memory-efficient approach
2. **docker-memory-optimize.sh**: Script for memory optimizations
3. **railway-build.sh/bat**: Updated with extreme memory constraints
4. **railway.json**: Configured for ultra-low memory usage
5. **ultra-memory-docker-build.bat**: New build script with extreme settings

## How To Build

Use the new ultra-optimized build script:
```
.\ultra-memory-docker-build.bat
```

## Manual Intervention (If All Else Fails)

If automated builds still fail, consider these manual steps:

1. **Pre-build node_modules locally**:
   ```
   npm install
   npm rebuild bcrypt
   docker build -t iazi-be-test -f Dockerfile.prebuilt .
   ```

2. **Use a multi-stage build with a node_modules copy**:
   Create a Dockerfile.prebuilt with:
   ```dockerfile
   FROM node:18-alpine as builder
   WORKDIR /app
   COPY . .
   
   FROM node:18-alpine
   WORKDIR /app
   COPY --from=builder /app .
   CMD npx prisma generate && node dist/index.js
   ```

3. **Consider reducing project dependencies**:
   Review package.json to identify and remove unnecessary packages.

## Railway Deployment

For Railway deployment with these extreme optimizations:
```
.\deploy-to-railway.bat
```

## Monitoring Memory Usage

Monitor memory usage with:
```
docker stats
```

These extreme optimizations should resolve the most persistent memory issues during Docker builds.
