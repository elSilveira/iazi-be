@echo off
echo ===== Starting Railway build with optimized configuration =====

echo Setting memory-efficient npm options...
set NODE_OPTIONS=--max-old-space-size=2048

echo Cleaning npm cache...
call npm cache clean --force

echo Installing dependencies with memory optimizations...
call npm ci --no-audit --no-fund || call npm install --no-audit --no-fund

echo Generating Prisma client...
call npx prisma generate

echo Building TypeScript application...
call npm run build

echo ===== Railway build completed successfully! =====
