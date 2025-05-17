// railway-direct-starter.js
// A direct starter script that doesn't rely on any shell scripts

const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Configuration
const port = process.env.PORT || 3002;
const logFile = 'railway-direct-starter.log';

// Log to console and file
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  try {
    fs.appendFileSync(logFile, logMessage + '\n');
  } catch (err) {
    console.error(`Error writing to log file: ${err.message}`);
  }
}

// Diagnostic information
log('=== RAILWAY DIRECT STARTER ===');
log(`Node version: ${process.version}`);
log(`OS: ${os.platform()} ${os.release()}`);
log(`Hostname: ${os.hostname()}`);
log(`PORT: ${port}`);
log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'set (hidden)' : 'not set'}`);

// Check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    log(`Error checking if file exists (${filePath}): ${err.message}`);
    return false;
  }
}

// Try to start the fallback server
function startFallbackServer() {
  log('Starting fallback server...');
  
  try {
    // Import the server directly if it's a node module
    require('./fallback-server.js');
  } catch (err) {
    log(`Error importing fallback server: ${err.message}`);
    
    // If that fails, try running it as a child process
    try {
      const fallbackProcess = spawn('node', ['fallback-server.js'], {
        stdio: 'inherit',
        shell: true
      });
      
      fallbackProcess.on('error', (err) => {
        log(`Error starting fallback server process: ${err.message}`);
      });
      
      fallbackProcess.on('exit', (code) => {
        log(`Fallback server process exited with code ${code}`);
      });
    } catch (err) {
      log(`Failed to start fallback server as child process: ${err.message}`);
      
      // Last resort: create an inline minimal server
      log('Starting inline minimal server as last resort...');
      startInlineMinimalServer();
    }
  }
}

// Create an ultra minimal inline server as last resort
function startInlineMinimalServer() {
  const server = http.createServer((req, res) => {
    log(`Request received: ${req.method} ${req.url}`);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      res.end();
      return;
    }
    
    if (req.url === '/api/health') {
      res.statusCode = 200;
      res.end(JSON.stringify({
        status: 'ok',
        mode: 'inline-minimal',
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'ok',
      message: 'Inline minimal server is running',
      requestPath: req.url,
      timestamp: new Date().toISOString()
    }));
  });
  
  server.listen(port, '0.0.0.0', () => {
    log(`Inline minimal server listening on port ${port}`);
  });
  
  server.on('error', (err) => {
    log(`Inline server error: ${err.message}`);
  });
}

// Check if fallback server exists and start it
if (fileExists('./fallback-server.js')) {
  log('Fallback server file found. Starting it...');
  startFallbackServer();
} else {
  log('Fallback server file not found! Creating a temporary one...');
  
  // Create a basic fallback server file
  const fallbackServerContent = `
// Temporary fallback server created by railway-direct-starter.js
const http = require('http');
const port = process.env.PORT || 3002;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }
  
  res.statusCode = 200;
  res.end(JSON.stringify({
    status: 'ok',
    message: 'Temporary fallback server created by railway-direct-starter',
    timestamp: new Date().toISOString()
  }));
});

server.listen(port, '0.0.0.0', () => {
  console.log(\`Temporary fallback server listening on port \${port}\`);
});
`;
  
  try {
    fs.writeFileSync('temp-fallback-server.js', fallbackServerContent);
    log('Temporary fallback server file created');
    
    // Start the temporary fallback server
    const tempServer = spawn('node', ['temp-fallback-server.js'], {
      stdio: 'inherit',
      shell: true
    });
    
    tempServer.on('error', (err) => {
      log(`Error starting temporary fallback server: ${err.message}`);
      startInlineMinimalServer();
    });
  } catch (err) {
    log(`Failed to create temporary fallback server: ${err.message}`);
    startInlineMinimalServer();
  }
}
