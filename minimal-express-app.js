/**
 * Minimal Express App for Railway
 * This is a simplified version of the main app that only handles basic auth requests
 */

const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3002;

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appStatus: 'running',
    mode: 'minimal-express',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dbConnected: false, // We're not connecting to the database in this minimal version
    environment: process.env.NODE_ENV || 'development',
    dbError: 'Database connection not attempted in minimal mode'
  });
});

// Auth routes
const authRouter = express.Router();

// Login endpoint
authRouter.post('/login', (req, res) => {
  console.log('Login request received:', req.body);
  
  // Mock login response
  res.json({
    status: 'success',
    message: 'MINIMAL APP: Login successful',
    user: {
      id: 1,
      email: req.body.email || 'user@example.com',
      name: 'Test User',
      role: 'user'
    },
    token: 'mock-jwt-token-for-minimal-app',
    refreshToken: 'mock-refresh-token-for-minimal-app'
  });
});

// Register endpoint
authRouter.post('/register', (req, res) => {
  console.log('Register request received:', req.body);
  
  // Mock register response
  res.json({
    status: 'success',
    message: 'MINIMAL APP: Registration successful',
    user: {
      id: 2,
      email: req.body.email || 'newuser@example.com',
      name: req.body.name || 'New User',
      role: 'user'
    }
  });
});

// Refresh token endpoint
authRouter.post('/refresh-token', (req, res) => {
  console.log('Refresh token request received');
  
  res.json({
    status: 'success',
    message: 'MINIMAL APP: Token refreshed',
    token: 'new-mock-jwt-token',
    refreshToken: 'new-mock-refresh-token'
  });
});

// Mount auth router
app.use('/api/auth', authRouter);

// Default route for any other endpoint
app.use('*', (req, res) => {
  res.json({
    status: 'minimal',
    message: 'MINIMAL APP: This is a simplified version of the API running in Railway',
    availableEndpoints: [
      '/api/health',
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh-token'
    ],
    requestInfo: {
      method: req.method,
      url: req.originalUrl,
      body: req.body
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'An internal server error occurred',
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Minimal Express app listening at http://0.0.0.0:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
