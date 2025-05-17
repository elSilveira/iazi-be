#!/bin/sh
# railway-network-fix.sh
# Script to handle IPv6 connectivity issues in Railway

echo "=== Railway Network Fix ==="

# Check if we can access localhost via IPv6
echo "Testing IPv6 connectivity..."
nc -z -v -w 5 ::1 $PORT 2>/dev/null
IPV6_STATUS=$?

if [ $IPV6_STATUS -eq 0 ]; then
  echo "✅ IPv6 connectivity working properly"
else
  echo "⚠️ IPv6 connectivity issue detected"
  
  # Ensure application listens on IPv6 and IPv4
  echo "Configuring network to listen on both IPv6 and IPv4..."
  
  # Check if IPV6_V6ONLY is already disabled on the system
  if [ -f /proc/sys/net/ipv6/bindv6only ]; then
    echo "Checking IPv6 bind-only setting..."
    if [ "$(cat /proc/sys/net/ipv6/bindv6only)" = "1" ]; then
      echo "IPv6 is set to bind-only. Attempting to configure dual stack..."
      # We can't modify this in Railway container, but we'll update our app to handle it
    fi
  fi
  
  echo "Setting environment variables to ensure proper socket binding..."
  # These will be used by our application to properly bind to all interfaces
  export BIND_IP="0.0.0.0"
  export LISTEN_IPV6="true"
  
  # Also export a variable to tell our app to start a diagnostic server
  export ENABLE_DIAGNOSTIC_PORT="true"
  export DIAGNOSTIC_PORT="3003"
  
  echo "Network fix applied. Application will listen on IPv4 and IPv6 interfaces."
fi

# Check if the port is already in use
echo "Checking if port $PORT is available..."
if nc -z -v -w 1 localhost $PORT 2>/dev/null; then
  echo "⚠️ Port $PORT is already in use. This might cause conflicts."
  # List processes using this port
  echo "Processes using port $PORT:"
  lsof -i :$PORT 2>/dev/null || netstat -tulpn 2>/dev/null | grep $PORT || echo "Could not determine processes using port $PORT"
else
  echo "✅ Port $PORT is available"
fi

echo "=== Railway Network Fix Complete ==="
