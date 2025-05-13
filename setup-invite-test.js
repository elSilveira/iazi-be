/**
 * Setup script for invite endpoint testing
 * Installs required dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('==== Setting up Invite Endpoint Test Dependencies ====');

// Check if node-fetch is installed
try {
  console.log('Checking for node-fetch...');
  require('node-fetch');
  console.log('✅ node-fetch is already installed');
} catch (error) {
  console.log('⚠️ node-fetch is not installed, installing now...');
  try {
    // Install node-fetch@2 for CommonJS compatibility
    execSync('npm install --save-dev node-fetch@2', { stdio: 'inherit' });
    console.log('✅ node-fetch@2 installed successfully');
  } catch (installError) {
    console.error('❌ Failed to install node-fetch:');
    console.error(installError.message);
    process.exit(1);
  }
}

console.log('\n==== Setup Complete ====');
console.log('You can now run the tests with:');
console.log('  node run-invite-test.js');
console.log('Or follow the manual steps in INVITE-TEST-README.md');
