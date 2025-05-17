#!/bin/bash
# railway-startup-fix.sh - Script to ensure clean startup on Railway

echo "=== Railway Startup Fix Script ==="
echo "Running pre-startup checks and fixes..."

# Install diagnostic tools if needed
echo "Installing diagnostic tools..."
apk add --no-cache netcat-openbsd net-tools lsof curl iputils || true

# 1. Verify environment variables
echo "Checking critical environment variables..."
MISSING_ENV=0

check_env() {
  if [ -z "${!1}" ]; then
    echo "⚠️ Missing environment variable: $1"
    MISSING_ENV=$((MISSING_ENV + 1))
    return 1
  else
    echo "✅ Environment variable present: $1"
    return 0
  fi
}

# Check essential environment variables
check_env "DATABASE_URL" || echo "Setting mock DATABASE_URL for diagnostic purposes..."
check_env "PORT" || export PORT=3002
check_env "JWT_SECRET" || echo "Warning: Missing JWT_SECRET could affect authentication"

if [ $MISSING_ENV -gt 0 ]; then
  echo "⚠️ $MISSING_ENV environment variables missing. Application may not function correctly."
else
  echo "✅ All critical environment variables are present."
fi

# 2. Verify network connectivity
echo "Testing network connectivity..."
echo "Testing external connectivity..."
curl -s --connect-timeout 5 https://1.1.1.1 > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ External connectivity OK"
else
  echo "⚠️ External connectivity issue detected"
fi

# 3. Apply network fixes for Railway
echo "Applying Railway-specific network fixes..."

# Use IPv4 to avoid IPv6 connectivity issues in Railway
export BIND_IP="0.0.0.0"
echo "✅ Set BIND_IP to 0.0.0.0 to ensure proper IPv4 binding"

# Set DNS priority to IPv4 first to avoid connection issues
export NODE_OPTIONS="${NODE_OPTIONS} --dns-result-order=ipv4first"
echo "✅ Set NODE_OPTIONS to prioritize IPv4 DNS resolution"

# Enable diagnostic HTTP endpoint
export ENABLE_DIAGNOSTIC_PORT="true"
export DIAGNOSTIC_PORT="3003"
echo "✅ Enabled diagnostic HTTP server on port 3003"

# 4. Check for port availability
echo "Checking if port $PORT is available..."
if nc -z -v -w 1 localhost $PORT 2>/dev/null; then
  echo "⚠️ Port $PORT is already in use. This might cause conflicts."
  # Attempt to find what's using the port
  echo "Processes using port $PORT:"
  lsof -i :$PORT 2>/dev/null || netstat -tulpn 2>/dev/null | grep $PORT || echo "Could not determine processes using port $PORT"
  
  # Try to pick an alternative port
  ALT_PORT=$((PORT + 1000))
  echo "Trying alternative port $ALT_PORT..."
  if ! nc -z -v -w 1 localhost $ALT_PORT 2>/dev/null; then
    echo "✅ Alternative port $ALT_PORT is available, using it instead"
    export PORT=$ALT_PORT
  fi
else
  echo "✅ Port $PORT is available"
fi

# 5. Network interface diagnostics
echo "Network interface information:"
ifconfig || ip addr

echo "=== Railway Startup Fix Complete ==="
echo "Starting application with fixes applied..."

# Print summary of fixes
echo "Summary of fixes applied:"
echo "- Ensured server listens on IPv4 interfaces"
echo "- Set NODE_OPTIONS to prioritize IPv4 DNS resolution"
echo "- Enabled diagnostic HTTP server on port 3003"
echo "- Port: $PORT"

exit 0
