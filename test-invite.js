// Try requiring node-fetch, with a fallback error if not installed
let fetch;
try {
  fetch = require('node-fetch');
} catch (error) {
  console.error('❌ Error: node-fetch package is not installed.');
  console.error('Please run: npm install node-fetch@2');
  process.exit(1);
}

// Configuration
const baseUrl = 'http://localhost:3003'; // Running on the configured port from index.ts
const apiEndpoint = '/api/auth/invites';
const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4ZTc2ODY0MS0wYTIyLTRkNzQtOGVkOS01YzkyMGRhYWI0MzMiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTc0NzEwNTU4OCwiZXhwIjoxNzQ3MTA5MTg4fQ.ViM_j_AueuKpFiWw637RTuwEksX_XczF60PvcDMsMu8'; // Replace with a valid JWT token

async function testInviteCodeGeneration() {
  try {
    // Verify token is set
    if (authToken === 'YOUR_AUTH_TOKEN_HERE') {
      console.error('❌ Error: You need to replace YOUR_AUTH_TOKEN_HERE with a real JWT token');
      console.error('Run node generate-test-token.js and follow the instructions');
      return;
    }
    
    console.log('\n==== Testing Invite Code Generation ====');
    console.log(`Sending POST request to: ${baseUrl}${apiEndpoint}`);
    console.log('Authorization: Bearer [token]');
    
    const startTime = Date.now();
    const response = await fetch(`${baseUrl}${apiEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    const responseTime = Date.now() - startTime;

    // Get response data
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { error: 'Failed to parse response as JSON' };
    }
    
    console.log('\n==== Response Details ====');
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Time: ${responseTime}ms`);
    console.log('Headers:', Object.fromEntries([...response.headers.entries()]));
    console.log('Body:', JSON.stringify(data, null, 2));
    
    // Test result evaluation
    console.log('\n==== Test Result ====');
    if (response.ok) {
      if (data.code && typeof data.code === 'string') {
        console.log('✅ SUCCESS: Invite code generated successfully!');
        console.log(`Generated code: ${data.code}`);
      } else {
        console.log('⚠️ PARTIAL SUCCESS: Response successful but missing code property');
      }
    } else if (response.status === 401) {
      console.log('❌ AUTHENTICATION ERROR: Invalid or expired token');
      console.log('Solution: Generate a new token using node generate-test-token.js');
    } else if (response.status === 403) {
      console.log('❌ AUTHORIZATION ERROR: User does not have permission to generate invite codes');
      console.log('Solution: Use a token for a user with appropriate permissions');
    } else if (response.status >= 500) {
      console.log('❌ SERVER ERROR: The server encountered an error while processing the request');
      console.log('Solution: Check server logs for more details');
    } else {
      console.log(`❌ TEST FAILED: ${data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('\n==== Test Error ====');
    console.error('❌ Network or execution error:', error.message);
    console.error('Solution: Ensure the server is running at', baseUrl);
  }
}

// Check if server is running before executing test
async function checkServerStatus() {
  try {
    console.log(`Checking if server is running at ${baseUrl}...`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${baseUrl}/api/health`, { 
      signal: controller.signal 
    }).catch(() => {
      // Try root path if health endpoint doesn't exist
      return fetch(baseUrl, { signal: controller.signal });
    });
    
    clearTimeout(timeoutId);
    
    console.log(`✅ Server is running (Status: ${response.status})`);
    return true;
  } catch (error) {
    console.error('❌ Server check failed:', error.message);
    console.error('Please ensure the server is running at', baseUrl);
    console.error('You can adjust the server URL in this script if needed.');
    return false;
  }
}

// Main execution
async function runTests() {
  const serverRunning = await checkServerStatus();
  if (serverRunning) {
    await testInviteCodeGeneration();
  }
}

runTests();
