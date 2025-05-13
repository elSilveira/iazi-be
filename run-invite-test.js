/**
 * Convenience script to test the invite endpoint
 * This script generates a token and runs the test in sequence
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('==== Invite Endpoint Test Runner ====');

// Check for required files
const testFilePath = path.join(__dirname, 'test-invite.js');
const tokenGenPath = path.join(__dirname, 'generate-test-token.js');

if (!fs.existsSync(testFilePath) || !fs.existsSync(tokenGenPath)) {
  console.error('❌ Required test files are missing!');
  process.exit(1);
}

try {
  console.log('\n1. Generating JWT token...');
  // Run the token generation script and capture its output
  let tokenResult;
  try {
    tokenResult = execSync('node generate-test-token.js', { encoding: 'utf8' });
  } catch (error) {
    console.error('❌ Token generation failed!');
    console.error('Error details:', error.message);
    if (error.stdout) console.log('Output:', error.stdout.toString());
    if (error.stderr) console.log('Error output:', error.stderr.toString());
    process.exit(1);
  }
  
  // Extract the token from the output (assumes token is on its own line)
  const tokenMatch = tokenResult.match(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/);
  if (!tokenMatch) {
    console.error('❌ Failed to extract token from output!');
    console.log('Token generation output:', tokenResult); // Show the output for debugging
    process.exit(1);
  }
  
  const token = tokenMatch[0];
  console.log('✅ Token generated successfully');
  
  // Replace token in test file
  console.log('\n2. Updating test file with token...');
  const testFileContent = fs.readFileSync(testFilePath, 'utf8');
  const updatedContent = testFileContent.replace(
    /const authToken = ['"].*['"]/,
    `const authToken = '${token}'`
  );
  fs.writeFileSync(testFilePath, updatedContent);
  console.log('✅ Test file updated with new token');
  
  // Run the test
  console.log('\n3. Running invite endpoint test...');
  console.log('==== Test Output ====');
  execSync('node test-invite.js', { stdio: 'inherit' });
  
} catch (error) {
  console.error('\n❌ An error occurred during test execution:');
  console.error(error.message);
  if (error.stdout) console.log('stdout:', error.stdout.toString());
  if (error.stderr) console.log('stderr:', error.stderr.toString());
  process.exit(1);
}
