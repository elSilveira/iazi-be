// Startup diagnostic wrapper for index.js
// This file wraps the main application with error handling and diagnostics
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('=== Application Startup Diagnostics ===');
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log(`Node Version: ${process.version}`);
console.log(`OS: ${os.platform()} ${os.release()}`);
console.log(`Memory: ${Math.round(os.totalmem() / (1024 * 1024))}MB total, ${Math.round(os.freemem() / (1024 * 1024))}MB free`);
console.log(`Current Directory: ${process.cwd()}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`PORT: ${process.env.PORT || '3002 (default)'}`);
console.log(`DATABASE_URL configured: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);

// Check critical files
const criticalFiles = [
  'dist/index.js', 
  'dist/routes/healthRoutes.js',
  'dist/utils/prismaClient.js'
];

console.log('\nChecking critical files:');
let missingFiles = false;
criticalFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`${exists ? '✓' : '✗'} ${file} ${exists ? 'exists' : 'MISSING'}`);
  if (!exists) missingFiles = true;
});

if (missingFiles) {
  console.error('\n⚠️ Some critical files are missing. Application may not start correctly.');
  console.log('Available files in dist directory:');
  try {
    const distFiles = fs.readdirSync(path.join(process.cwd(), 'dist'));
    console.log(distFiles.join('\n'));
  } catch (err) {
    console.error('Could not list dist directory:', err.message);
  }
}

// Start the application with error handling
console.log('\nStarting application...');
try {
  // Use dynamic import to allow for better error handling
  import('./dist/index.js')
    .then(() => {
      console.log('Application started successfully.');
    })
    .catch(err => {
      console.error('Failed to start application:', err);
      console.error('Stack trace:', err.stack);
      
      // Log details about potential database connection issues
      if (err.message && err.message.includes('database') || err.message.includes('prisma')) {
        console.error('\n⚠️ Database connection error detected.');
        console.error('Please verify DATABASE_URL environment variable and database connectivity.');
      }
      
      // Exit with non-zero code after a delay to ensure logs are flushed
      setTimeout(() => process.exit(1), 1000);
    });
} catch (err) {
  console.error('Critical error during application startup:', err);
  console.error('Stack trace:', err.stack);
  // Exit with non-zero code after a delay to ensure logs are flushed
  setTimeout(() => process.exit(1), 1000);
}
