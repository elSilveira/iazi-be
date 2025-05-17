/**
 * Deployment Diagnostics Script
 * 
 * This script runs in the deployed environment and collects
 * vital information to diagnose connectivity and startup issues.
 * 
 * Usage:
 *   node deployment-diagnostics.js
 */

const http = require('http');
const os = require('os');
const { exec } = require('child_process');
const dns = require('dns');
const net = require('net');

// Configuration
const PORT = process.env.PORT || 3002;
const HOST = '::'; // Dual stack IPv6

console.log('=== DEPLOYMENT DIAGNOSTICS ===');
console.log(`Date: ${new Date().toISOString()}`);
console.log(`Node Version: ${process.version}`);
console.log(`Platform: ${os.platform()} ${os.release()}`);

// Environment Variables
console.log('\n=== ENVIRONMENT VARIABLES ===');
const importantVars = [
  'PORT', 'NODE_ENV', 'DATABASE_URL', 'NODE_OPTIONS',
  'RAILWAY_ENVIRONMENT', 'RAILWAY_SERVICE_ID'
];
importantVars.forEach(varName => {
  console.log(`${varName}: ${process.env[varName] || 'not set'}`);
});

// Network Interfaces
console.log('\n=== NETWORK INTERFACES ===');
const interfaces = os.networkInterfaces();
for (const [name, netInterface] of Object.entries(interfaces)) {
  console.log(`Interface: ${name}`);
  netInterface.forEach(iface => {
    console.log(`  ${iface.family}: ${iface.address} (${iface.internal ? 'internal' : 'external'})`);
  });
}

// Memory Usage
console.log('\n=== MEMORY USAGE ===');
const memUsage = process.memoryUsage();
Object.entries(memUsage).forEach(([key, value]) => {
  console.log(`${key}: ${Math.round(value / 1024 / 1024)} MB`);
});
console.log(`Total Memory: ${Math.round(os.totalmem() / 1024 / 1024)} MB`);
console.log(`Free Memory: ${Math.round(os.freemem() / 1024 / 1024)} MB`);

// Port Binding Test
console.log('\n=== PORT BINDING TEST ===');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Diagnostics server works!\n');
});

// Attempt to bind to the port
server.on('error', (err) => {
  console.error(`Port binding error: ${err.message}`);
});

server.listen(PORT, HOST, () => {
  console.log(`Successfully bound to ${HOST}:${PORT}`);
  
  // Close the server after the test
  server.close();
});

// DNS Resolution Test
console.log('\n=== DNS RESOLUTION TEST ===');
dns.lookup('database.railway.internal', (err, address, family) => {
  if (err) {
    console.error(`DNS lookup error: ${err.message}`);
  } else {
    console.log(`Railway database internal DNS: ${address} (IPv${family})`);
  }
});

// Try common connections
console.log('\n=== CONNECTION TESTS ===');
function testConnection(host, port, name) {
  return new Promise((resolve) => {
    const socket = net.createConnection(port, host);
    
    let status = 'Unknown';
    
    socket.on('connect', () => {
      status = 'Success';
      socket.end();
    });
    
    socket.on('error', (err) => {
      status = `Failed: ${err.message}`;
    });
    
    socket.on('close', () => {
      console.log(`${name}: ${status}`);
      resolve();
    });
    
    // Set a timeout
    socket.setTimeout(3000, () => {
      socket.destroy();
      status = 'Timeout after 3s';
    });
  });
}

// Run all tests then exit
Promise.all([
  testConnection('database.railway.internal', 5432, 'PostgreSQL Database'),
  testConnection('google.com', 80, 'Internet Connectivity'),
  testConnection('localhost', PORT, 'Local Port'),
]).then(() => {
  console.log('\n=== DIAGNOSTICS COMPLETE ===');
  
  // Give time for async operations to complete
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});
