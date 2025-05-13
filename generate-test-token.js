// Try requiring dependencies, with fallback errors if not installed
let jwt, UserRole;

try {
  jwt = require('jsonwebtoken');
} catch (error) {
  console.error('❌ Error: jsonwebtoken package is not installed.');
  console.error('Please run: npm install jsonwebtoken');
  process.exit(1);
}

try {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
    // Get a real user from the database for a more accurate test
  async function getTestUser() {
    try {
      console.log('Fetching a test user from the database...');
      const user = await prisma.user.findFirst();
      if (!user) {
        console.log('No users found in database, using mock user data');
        return null;
      }
      console.log(`Found user: ${user.name} (${user.email})`);
      return user;
    } catch (error) {
      console.error('Error connecting to database:', error.message);
      return null;
    } finally {
      await prisma.$disconnect();
    }
  }

  // Immediately invoke the function
  getTestUser().then(user => {    // Configuration
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret'; // Use the same secret as in your app
    const expiresIn = '1h'; // Token expires in 1 hour
    
    // Generate payload with actual user data if available
    // For the role, we convert to string to avoid enum issues with UserRole
    const payload = {
      userId: user ? user.id : 'mock-user-id',
      role: user ? String(user.role) : 'USER',
    };
    
    // Create JWT token
    const token = jwt.sign(payload, jwtSecret, { expiresIn });
    
    console.log('\n==== Generated JWT Token ====');
    console.log(token);
    console.log('\n==== Instructions ====');
    console.log('1. Copy the token above');
    console.log('2. Replace YOUR_AUTH_TOKEN_HERE in test-invite.js with this token');
    console.log('3. Run the test with: node test-invite.js');
    
    if (!user) {
      console.log('\n⚠️ Warning: Using mock user data. For better testing, ensure the database has users and is correctly configured.');
    }
  });
} catch (error) {
  console.error('❌ Error: @prisma/client package is not installed or properly configured.');
  console.error('Falling back to mock user data...');
  
  // Fallback if Prisma fails
  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
  const expiresIn = '1h';
  
  // Mock payload - Using string literal for role instead of enum
  const payload = {
    userId: 'mock-user-id',
    role: 'USER', // Use string literal instead of enum
  };
  
  // Create JWT token
  const token = jwt.sign(payload, jwtSecret, { expiresIn });
  
  console.log('\n==== Generated JWT Token (Mock User) ====');
  console.log(token);
  console.log('\n==== Instructions ====');
  console.log('1. Copy the token above');
  console.log('2. Replace YOUR_AUTH_TOKEN_HERE in test-invite.js with this token');
  console.log('3. Run the test with: node test-invite.js');
  console.log('\n⚠️ Warning: Using mock user data. For better testing, ensure the database is correctly configured.');
}
