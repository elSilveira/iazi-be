# Docker Script Permission Fix

This document explains the approach used to fix script permission issues during Docker builds.

## Problem

The Docker build was failing with the following error:
```
/bin/sh: ./docker-typescript-build.sh: Permission denied
```

Despite using the `chmod +x` command in the Dockerfile, the script was still not executable during the build process.

## Root Causes

There are several potential causes for this issue:

1. **Line Endings**: Scripts created on Windows use CRLF line endings, which can cause issues in Unix/Linux environments.
2. **Permission Handling**: Docker COPY operations don't preserve execute permissions when copying from Windows hosts.
3. **Layer Caching**: Sometimes changes to permissions in one layer don't propagate correctly to subsequent layers.

## Solution

We implemented a multi-layered approach to fix the permission issues:

### 1. Line Ending Conversion

- Added the `dos2unix` utility to convert Windows line endings to Unix format
- Applied conversion to all shell scripts

### 2. Multiple Execution Methods

- Added fallback methods to execute the script:
  - First attempt: Direct execution (`./script.sh`)
  - Second attempt: Using bash (`bash script.sh`) 
  - Third attempt: Embedded TypeScript build in the Dockerfile

### 3. Self-Healing Scripts

- Created a `fix-permissions.sh` script that:
  - Sets execute permissions on all shell scripts
  - Converts line endings to Unix format
  - Recreates the TypeScript build script if it's missing or non-executable

### 4. Dockerfile Improvements

- Added bash to the Alpine image
- Added verification of permissions before script execution
- Added emergency build process as a last resort

## Usage

To test the Docker build with these fixes, run:
```bash
./test-docker-build-permission-fix.bat
```

When successful, you can deploy to Railway with:
```bash
./deploy-to-railway-with-ts-fix.bat
```

## Preventing Future Issues

1. Always use Unix line endings (LF) for shell scripts
2. Use explicit bash execution in Dockerfiles (`bash script.sh` instead of `./script.sh`)
3. Verify permissions after `COPY` operations in Dockerfiles
4. Include fallback execution methods for critical build steps
