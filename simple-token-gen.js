/**
 * Simple JWT token generator for testing
 * This script doesn't rely on Prisma or other complex dependencies
 */

let jwt;
try {
  jwt = require('jsonwebtoken');
} catch (error) {
  console.error('❌ Error: jsonwebtoken package is not installed.');
  console.error('Please run: npm install jsonwebtoken');
  process.exit(1);
}

const fs = require('fs');
const path = require('path');

console.log('==== Simple JWT Token Generator ====');

// Configuration
const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
const expiresIn = '1h'; // Token expires in 1 hour

// Define user roles as strings
const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  PROFESSIONAL: 'PROFESSIONAL',
  COMPANY_OWNER: 'COMPANY_OWNER',
  STAFF: 'STAFF'
};

// Default to regular user, but allow role to be specified as command line arg
// Usage: node simple-token-gen.js ADMIN
const requestedRole = process.argv[2] || USER_ROLES.USER;
const role = USER_ROLES[requestedRole] || USER_ROLES.USER;

// Create payload
const payload = {
  userId: `test-${role.toLowerCase()}-id`, // Mock ID
  role: role,
};

// Create JWT token
const token = jwt.sign(payload, jwtSecret, { expiresIn });

console.log(`\n==== Generated JWT Token (Role: ${role}) ====`);
console.log(token);

// Optionally update the test file
const testFilePath = path.join(__dirname, 'test-invite.js');
if (fs.existsSync(testFilePath)) {
  const updateFile = process.argv.includes('--update') || process.argv.includes('-u');
  
  if (updateFile) {
    try {
      console.log('\nUpdating test file with new token...');
      const testFileContent = fs.readFileSync(testFilePath, 'utf8');
      const updatedContent = testFileContent.replace(
        /const authToken = ['"].*['"]/,
        `const authToken = '${token}'`
      );
      fs.writeFileSync(testFilePath, updatedContent);
      console.log('✅ Test file updated with new token');
    } catch (error) {
      console.error('❌ Failed to update test file:', error.message);
    }
  } else {
    console.log('\nTo automatically update the test file, run:');
    console.log(`node ${path.basename(__filename)} ${requestedRole} --update`);
  }
}

console.log('\n==== Instructions ====');
console.log('1. Copy the token above');
console.log('2. Replace YOUR_AUTH_TOKEN_HERE in test-invite.js with this token');
console.log('3. Run the test with: node test-invite.js');

// Decode and display token information
try {
  console.log('\n==== Token Details ====');
  const decoded = jwt.verify(token, jwtSecret);
  console.log(JSON.stringify(decoded, null, 2));
  const expiry = new Date(decoded.exp * 1000).toLocaleString();
  console.log(`Token expires at: ${expiry}`);
} catch (error) {
  console.error('Error decoding token:', error.message);
}
