/**
 * Ultra-minimal fallback server for Railway deployment
 * This server will respond to all requests with a basic JSON response,
 * ensuring that Railway can connect to the application.
 */

// Use only built-in Node.js modules to avoid any dependencies
const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Configuration
const port = process.env.PORT || 3002;
const bindAddress = process.env.BIND_IP || '0.0.0.0'; // Ensure IPv4 binding

// System diagnostics
const diagnostics = {
  nodeVersion: process.version,
  platform: `${os.platform()} ${os.release()}`,
  hostname: os.hostname(),
  cpus: os.cpus().length,
  memory: {
    total: `${Math.round(os.totalmem() / (1024 * 1024))} MB`,
    free: `${Math.round(os.freemem() / (1024 * 1024))} MB`,
  },
  uptime: os.uptime(),
  cwd: process.cwd(),
  env: {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    PORT: process.env.PORT || 'not set',
    DATABASE_URL: process.env.DATABASE_URL ? 'set (hidden)' : 'not set',
    JWT_SECRET: process.env.JWT_SECRET ? 'set (hidden)' : 'not set',
  }
};

console.log('=== RAILWAY FALLBACK SERVER ===');
console.log(`Starting minimal fallback server on ${bindAddress}:${port}`);
console.log(`Node version: ${diagnostics.nodeVersion}`);
console.log(`OS: ${diagnostics.platform}`);
console.log(`Hostname: ${diagnostics.hostname}`);
console.log(`CPUs: ${diagnostics.cpus}`);
console.log(`Memory: ${diagnostics.memory.total} total, ${diagnostics.memory.free} free`);
console.log(`CWD: ${diagnostics.cwd}`);

// List directory contents
try {
  console.log('\nDirectory contents:');
  const files = fs.readdirSync('.');
  files.forEach(file => {
    const stats = fs.statSync(file);
    console.log(`${file} (${stats.isDirectory() ? 'directory' : 'file'}, ${Math.round(stats.size / 1024)} KB)`);
  });
} catch (err) {
  console.error(`Error listing directory: ${err.message}`);
}

// Try to start the main app in the background
let mainAppProcess = null;
function tryStartMainApp() {
  console.log('\nAttempting to start the main application in the background...');
  
  const distFolder = path.join(__dirname, 'dist');
  const indexFile = path.join(distFolder, 'index.js');
  
  if (fs.existsSync(indexFile)) {
    console.log(`Found main app entry point: ${indexFile}`);
    try {
      // Try running the TypeScript application as a child process
      mainAppProcess = spawn('node', [indexFile], {
        stdio: 'pipe',
        env: {
          ...process.env,
          PORT: process.env.MAIN_APP_PORT || 3003, // Use a different port to avoid conflicts
          FALLBACK_RUNNING: 'true'
        }
      });
      
      console.log(`Main app process started with PID ${mainAppProcess.pid}`);
      
      // Collect output from the main app process
      let mainAppOutput = '';
      mainAppProcess.stdout.on('data', (data) => {
        const output = data.toString();
        mainAppOutput += output;
        console.log(`[MAIN APP] ${output.trim()}`);
      });
      
      mainAppProcess.stderr.on('data', (data) => {
        const output = data.toString();
        mainAppOutput += output;
        console.error(`[MAIN APP ERROR] ${output.trim()}`);
      });
      
      mainAppProcess.on('error', (err) => {
        console.error(`Error starting main app: ${err.message}`);
      });
      
      mainAppProcess.on('exit', (code) => {
        console.log(`Main app process exited with code ${code}`);
        
        // Save the output to a file for debugging
        try {
          fs.writeFileSync('main-app-output.log', mainAppOutput);
          console.log('Main app output saved to main-app-output.log');
        } catch (err) {
          console.error(`Failed to save main app output: ${err.message}`);
        }
        
        // Set mainAppProcess to null so we know it's not running
        mainAppProcess = null;
      });
      
    } catch (err) {
      console.error(`Failed to start main application: ${err.message}`);
    }
  } else {
    console.log(`Main app entry point not found at ${indexFile}`);
  }
}

// Create a basic HTTP server
const server = http.createServer((req, res) => {
  // Set common headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }
  
  // Log every request
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Route handling
  try {
    if (req.url === '/api/health' || req.url === '/health') {
      // Health check endpoint
      res.statusCode = 200;
      res.end(JSON.stringify({
        status: 'ok',
        mode: 'fallback',
        mainAppRunning: mainAppProcess !== null,
        timestamp: new Date().toISOString(),
        diagnostics: {
          ...diagnostics,
          uptime: os.uptime() // Update uptime dynamically
        }
      }));
    } else if (req.url === '/api/diagnostics') {
      // System diagnostics endpoint
      res.statusCode = 200;
      res.end(JSON.stringify({
        diagnostics,
        files: fs.readdirSync('.'),
        mainAppRunning: mainAppProcess !== null,
        timestamp: new Date().toISOString()
      }));
    } else if (req.url === '/api/crash') {
      // For testing crash recovery
      setTimeout(() => {
        console.log('Intentionally crashing the process...');
        process.exit(1);
      }, 500);
      
      res.statusCode = 200;
      res.end(JSON.stringify({
        status: 'crashing',
        message: 'Server will crash in 500ms'
      }));
    } else {
      // Default response for all other routes
      res.statusCode = 200;
      res.end(JSON.stringify({
        status: 'ok',
        message: 'Fallback server is running',
        requestPath: req.url,
        info: 'This is a fallback server. The main application may still be starting.',
        mainAppRunning: mainAppProcess !== null,
        timestamp: new Date().toISOString()
      }));
    }
  } catch (error) {
    // Handle any errors that occur during request processing
    console.error(`Error handling request: ${error.message}`);
    res.statusCode = 500;
    res.end(JSON.stringify({
      status: 'error',
      message: 'An error occurred while processing your request',
      timestamp: new Date().toISOString()
    }));
  }
});

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  console.error('Stack trace:', err.stack);
  // Don't exit the process, try to keep the server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  // Don't exit the process, try to keep the server running
});

// Function to start the server with a specific port and bind address
function startServer(port, bindAddress) {
  return new Promise((resolve, reject) => {
    try {
      server.listen(port, bindAddress, () => {
        console.log(`Fallback server running at http://${bindAddress}:${port}`);
        resolve(true);
      });
      
      server.on('error', (err) => {
        console.error(`Server error on ${bindAddress}:${port}: ${err.message}`);
        reject(err);
      });
    } catch (err) {
      console.error(`Error starting server on ${bindAddress}:${port}: ${err.message}`);
      reject(err);
    }
  });
}

// Try multiple server configurations if the first one fails
async function tryMultipleServerConfigs() {
  const configs = [
    { port: port, bindAddress: bindAddress },
    { port: port, bindAddress: '0.0.0.0' },
    { port: 8080, bindAddress: '0.0.0.0' },
    { port: 80, bindAddress: '0.0.0.0' }
  ];
  
  for (const config of configs) {
    try {
      console.log(`Attempting to start server on ${config.bindAddress}:${config.port}...`);
      await startServer(config.port, config.bindAddress);
      
      // If we get here, server started successfully
      console.log(`Server successfully started on ${config.bindAddress}:${config.port}`);
      
      // Create a status file to indicate that the fallback server is running
      try {
        const statusFile = path.join(__dirname, 'fallback-server-running.txt');
        const content = `Fallback server started at ${new Date().toISOString()}
Port: ${config.port}
Bind address: ${config.bindAddress}
Node version: ${process.version}
Platform: ${os.platform()} ${os.release()}
Hostname: ${os.hostname()}
`;
        fs.writeFileSync(statusFile, content, 'utf8');
        console.log(`Status file created at ${statusFile}`);
      } catch (err) {
        console.error(`Could not create status file: ${err.message}`);
      }
      
      // Try to start the main app in background after a delay
      setTimeout(tryStartMainApp, 5000);
      
      return; // Exit the function since we successfully started a server
    } catch (err) {
      console.error(`Failed to start server with config ${JSON.stringify(config)}: ${err.message}`);
      // Continue to the next configuration
    }
  }
  
  // If we get here, all server configurations failed
  console.error('ALL SERVER CONFIGURATIONS FAILED!');
  
  // Last resort: create a minimal server on a random port
  const randomPort = Math.floor(Math.random() * 10000) + 10000;
  console.log(`Last resort: trying random port ${randomPort}...`);
  
  try {
    server.listen(randomPort, '0.0.0.0', () => {
      console.log(`Last resort fallback server running at http://0.0.0.0:${randomPort}`);
    });
  } catch (err) {
    console.error(`Even last resort server failed: ${err.message}`);
  }
}

// Start the server with multiple fallback configurations
tryMultipleServerConfigs();
