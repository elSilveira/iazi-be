@echo off
echo Backing up TypeScript build fix files...

REM Create backup directory
set BACKUP_DIR=typescript-build-fixes-backup
mkdir %BACKUP_DIR% 2>nul

REM Copy all relevant files
copy Dockerfile %BACKUP_DIR%\
copy comprehensive-ts-build.sh %BACKUP_DIR%\
copy emergency-build-ultra.sh %BACKUP_DIR%\
copy diagnose-ts-errors.sh %BACKUP_DIR%\
copy docker-typescript-build.sh %BACKUP_DIR%\
copy tsconfig.docker.json %BACKUP_DIR%\
copy verify-typescript-fixes.sh %BACKUP_DIR%\
copy COMPREHENSIVE-TYPESCRIPT-BUILD-FIX.md %BACKUP_DIR%\

echo Backup complete! Files saved to %BACKUP_DIR% directory.
echo Use these files if you need to restore the TypeScript build fixes.
