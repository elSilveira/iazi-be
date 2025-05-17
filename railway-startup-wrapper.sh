#!/bin/bash
# railway-startup-wrapper.sh - Ensures something always responds in Railway

echo "=== Railway Startup Wrapper ==="
echo "Starting application with fallback mechanism..."

# Install necessary tools
echo "Installing diagnostic tools..."
apk add --no-cache netcat-openbsd net-tools lsof curl iputils || true

# Make all scripts executable
chmod +x *.sh || true
chmod +x /usr/local/bin/docker-memory-optimize.sh || true

# Set critical environment variables
export BIND_IP="0.0.0.0"
export NODE_OPTIONS="${NODE_OPTIONS} --dns-result-order=ipv4first"
export ENABLE_DIAGNOSTIC_PORT="true"
export DIAGNOSTIC_PORT="3003"

# Run the network fix script
./railway-network-fix.sh || true

# Run the startup fix script
./railway-startup-fix.sh || true

# Apply memory optimizations
source /usr/local/bin/docker-memory-optimize.sh || true

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate || true

# Create a PID file to track the main application
PID_FILE="/tmp/main-app.pid"

# Start the main application in the background
echo "Starting main application..."
(DEBUG=express:* node --dns-result-order=ipv4first app-startup.mjs & echo $! > $PID_FILE) &

# Give the main application some time to start
echo "Waiting for main application to start..."
sleep 10

# Check if the main application is responding
echo "Checking if main application is responding..."
MAIN_APP_RESPONDING=0
for i in {1..3}; do
  echo "Health check attempt $i..."
  if curl -s http://localhost:$PORT/api/health > /dev/null; then
    echo "Main application is responding!"
    MAIN_APP_RESPONDING=1
    break
  fi
  sleep 5
done

# If the main application is not responding, try the minimal Express app first
if [ $MAIN_APP_RESPONDING -eq 0 ]; then
  echo "Main application is not responding. Trying minimal Express app..."
  
  # Kill the main application if it's still running
  if [ -f $PID_FILE ]; then
    MAIN_PID=$(cat $PID_FILE)
    echo "Stopping main application (PID: $MAIN_PID)..."
    kill $MAIN_PID || true
    rm $PID_FILE
  fi
  
  # Start the minimal Express app
  echo "Starting minimal Express app..."
  node minimal-express-app.js &
  EXPRESS_PID=$!
  echo $EXPRESS_PID > /tmp/express-app.pid
  
  # Wait for Express app to start
  echo "Waiting for minimal Express app to start..."
  sleep 5
  
  # Check if Express app is responding
  EXPRESS_RESPONDING=0
  for i in {1..3}; do
    echo "Express app health check attempt $i..."
    if curl -s http://localhost:$PORT/api/health > /dev/null; then
      echo "Minimal Express app is responding!"
      EXPRESS_RESPONDING=1
      break
    fi
    sleep 5
  done
  
  # If Express app is not responding either, use the bare-bones fallback server
  if [ $EXPRESS_RESPONDING -eq 0 ]; then
    echo "Minimal Express app is not responding. Starting bare-bones fallback server..."
    
    # Kill the Express app if it's running
    kill $EXPRESS_PID || true
    rm /tmp/express-app.pid
    
    # Start the fallback server
    exec node fallback-server.js
  else
    # If Express app is working, keep it running
    echo "Minimal Express app is running. Using it as fallback."
    
    # Output diagnostic info to help debugging
    echo "Railway environment: $RAILWAY_ENVIRONMENT"
    echo "PORT: $PORT"
    echo "NODE_ENV: $NODE_ENV"
    
    # Keep the script running with the Express app
    wait $EXPRESS_PID
  fi
else
  # If the main application is responding, keep it running
  echo "Main application is running correctly. Continuing with normal operation."
  
  # Get the PID of the main application
  if [ -f $PID_FILE ]; then
    MAIN_PID=$(cat $PID_FILE)
    echo "Main application PID: $MAIN_PID"
    
    # Wait for the main application process to exit
    echo "Waiting for main application to exit..."
    wait $MAIN_PID
  else
    echo "Main application PID file not found."
    
    # If we can't find the PID, just keep the script running
    echo "Keeping wrapper script alive..."
    while true; do
      sleep 60
      echo "Wrapper still alive, checking application status..."
      if ! curl -s http://localhost:$PORT/api/health > /dev/null; then
        echo "Application is no longer responding. Starting minimal Express app..."
        node minimal-express-app.js
        break
      fi
    done
  fi
fi
