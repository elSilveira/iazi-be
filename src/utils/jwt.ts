import jwt from 'jsonwebtoken';
import type { SignOptions, Secret } from 'jsonwebtoken';

// Placeholder for JWT secret - should be in environment variables
const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-default-secret'; // Use Secret type

// Define a type that explicitly matches the expected string literals or number
// Example literals: '1h', '2d', '7d'. Add more as needed or keep it general if usage varies.
type ExpiresInLiteral = '1h' | '2d' | '7d' | number; // Restrict string to known valid literals

// Placeholder function to satisfy imports in tests
export const generateToken = (payload: object, expiresIn: ExpiresInLiteral = '1h'): string => {
  console.log(`Generating token for payload: ${JSON.stringify(payload)} with secret (placeholder)`);

  // Create SignOptions object. expiresIn type is now more restricted.
  const options: SignOptions = { expiresIn };

  // This assignment should now be compatible as ExpiresInLiteral is a subset of StringValue | number
  return jwt.sign(payload, JWT_SECRET, options);
};

// Placeholder for verifying token if needed elsewhere
export const verifyToken = (token: string): object | string => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Invalid token:', error);
    return 'Invalid token';
  }
};

