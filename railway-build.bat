@echo off
echo ===== Starting Railway build with ultra-optimized memory configuration =====

echo Setting extreme memory-efficient npm options...
set NODE_OPTIONS=--max-old-space-size=512 --expose-gc --gc-global
set NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
set NPM_CONFIG_PREFER_OFFLINE=true
set NPM_CONFIG_LOGLEVEL=error
set NPM_CONFIG_AUDIT=false
set NPM_CONFIG_FUND=false
set NPM_CONFIG_OPTIONAL=false
set NPM_CONFIG_PROGRESS=false
set NPM_CONFIG_UPDATE_NOTIFIER=false
set PRISMA_CLI_MEMORY_MIN=64
set PRISMA_CLI_MEMORY_MAX=512

echo Aggressive cleanup...
call npm cache clean --force
if exist %TEMP%\npm-* rmdir /s /q %TEMP%\npm-*

echo Installing dependencies with ultra memory-efficient approach...
call npm install --no-audit --no-fund --ignore-scripts --no-optional --prefer-offline

echo Rebuilding only critical native modules...
call npm rebuild bcrypt

echo Generating Prisma client with memory limits...
call npx prisma generate

echo Final cleanup to free memory...
call npm cache clean --force

echo Building TypeScript application with tight memory constraints...
call npm run build

echo ===== Railway build completed successfully! =====
