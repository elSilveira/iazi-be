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

// Configuration
const port = process.env.PORT || 3002;
const bindAddress = process.env.BIND_IP || '0.0.0.0'; // Ensure IPv4 binding

console.log('=== RAILWAY FALLBACK SERVER ===');
console.log(`Starting minimal fallback server on ${bindAddress}:${port}`);
console.log(`Node version: ${process.version}`);
console.log(`OS: ${os.platform()} ${os.release()}`);
console.log(`Hostname: ${os.hostname()}`);
console.log('Network interfaces:');
console.log(JSON.stringify(os.networkInterfaces(), null, 2));

// Environment variables
console.log('\nEnvironment variables:');
console.log(`PORT: ${process.env.PORT || '3002 (default)'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'set (hidden)' : 'not set'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'set (hidden)' : 'not set'}`);

// Create basic HTTP server
const server = http.createServer((req, res) => {
    const startTime = Date.now();
    
    // Log request details
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    
    // Set CORS headers to allow all origins
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
    
    // Handle OPTIONS requests for CORS preflight
    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }
    
    // Handle health check endpoint
    if (req.url === '/api/health') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        const healthResponse = {
            status: 'ok',
            mode: 'fallback',
            timestamp: new Date().toISOString(),
            appStatus: 'running',
            dbConnected: false,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            hostname: os.hostname(),
            environment: process.env.NODE_ENV || 'development'
        };
        res.end(JSON.stringify(healthResponse, null, 2));
        return;
    }
    
    // Handle auth endpoints with mock responses
    if (req.url.startsWith('/api/auth/')) {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            
            // Mock response for login endpoint
            if (req.url === '/api/auth/login') {
                const mockResponse = {
                    status: 'success',
                    message: 'FALLBACK SERVER: Login request received',
                    user: { id: 1, email: 'fallback@example.com', role: 'user' },
                    token: 'fallback-mock-token',
                    refreshToken: 'fallback-mock-refresh-token'
                };
                res.end(JSON.stringify(mockResponse, null, 2));
                return;
            }
            
            // Default response for other auth endpoints
            const mockResponse = {
                status: 'success',
                message: `FALLBACK SERVER: Request to ${req.url} received`,
                info: 'This is a fallback server running in Railway'
            };
            res.end(JSON.stringify(mockResponse, null, 2));
        });
        return;
    }
    
    // Default response for all other requests
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    
    const responseData = {
        status: 'fallback',
        message: 'Railway Fallback Server is running',
        info: 'The main application is not available, this is a fallback server',
        requestDetails: {
            method: req.method,
            url: req.url,
            headers: req.headers,
            processingTime: `${Date.now() - startTime}ms`
        },
        serverInfo: {
            nodeVersion: process.version,
            platform: os.platform(),
            release: os.release(),
            uptime: process.uptime(),
            memory: process.memoryUsage()
        }
    };
    
    res.end(JSON.stringify(responseData, null, 2));
});

// Start the server and handle any errors
server.listen(port, bindAddress, () => {
    console.log(`Fallback server running at http://${bindAddress}:${port}`);
    
    // Create a status file to indicate that the fallback server is running
    const statusFile = path.join(__dirname, 'fallback-server-running.txt');
    fs.writeFileSync(statusFile, `Fallback server started at ${new Date().toISOString()}\n`, 'utf8');
});

server.on('error', (error) => {
    console.error('Server error:', error);
    
    // Try to bind to a different port if the original port is in use
    if (error.code === 'EADDRINUSE') {
        const newPort = parseInt(port) + 100;
        console.log(`Port ${port} is in use, trying port ${newPort}...`);
        
        // Close the current server
        server.close();
        
        // Start on new port
        server.listen(newPort, bindAddress, () => {
            console.log(`Fallback server running at http://${bindAddress}:${newPort}`);
        });
    }
});

// Handle process termination
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down fallback server...');
    server.close(() => {
        console.log('Fallback server closed.');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down fallback server...');
    server.close(() => {
        console.log('Fallback server closed.');
    });
});

// Keep the process alive
setInterval(() => {
    console.log(`[${new Date().toISOString()}] Fallback server heartbeat. Uptime: ${process.uptime().toFixed(2)}s`);
}, 60000);