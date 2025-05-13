/**
 * Simple test runner that uses the simple token generator
 * This script doesn't rely on complex dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('==== Simple Invite Endpoint Test Runner ====');

// Check for required files
const testFilePath = path.join(__dirname, 'test-invite.js');
const tokenGenPath = path.join(__dirname, 'simple-token-gen.js');

if (!fs.existsSync(testFilePath)) {
  console.error('❌ Test file is missing!');
  process.exit(1);
}

if (!fs.existsSync(tokenGenPath)) {
  console.error('❌ Simple token generator is missing!');
  process.exit(1);
}

try {
  // Get the role from command line args or default to USER
  const role = process.argv[2] || 'USER';
  
  console.log(`\n1. Generating JWT token with role: ${role}...`);
  // Run the token generation script with update flag
  execSync(`node ${path.basename(tokenGenPath)} ${role} --update`, { stdio: 'inherit' });
  console.log('\n✅ Token generated and test file updated');
  
  // Run the test
  console.log('\n2. Running invite endpoint test...');
  console.log('==== Test Output ====');
  execSync(`node ${path.basename(testFilePath)}`, { stdio: 'inherit' });
  
} catch (error) {
  console.error('\n❌ An error occurred:');
  console.error(error.message);
  process.exit(1);
}
