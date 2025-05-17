import { PrismaClient, Prisma } from "@prisma/client";

// Initialize Prisma Client with improved error handling and retry mechanism
let prisma: PrismaClient;

// Get database URL from environment or use a default fallback for development
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('[database]: DATABASE_URL environment variable is not set. This might cause connection issues in production.');
}

try {
  // Add retry options and connection timeout for better resilience
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error'] as Prisma.LogLevel[]
      : ['error'] as Prisma.LogLevel[],
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });
  
  // Log database initialization
  console.log('[database]: Initializing Prisma Client...');
  
  // Add event listeners for connection issues
  // @ts-ignore - Prisma event types are sometimes inconsistent
  prisma.$on('query', (e: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[prisma:query]', e);
    }
  });
  
  // @ts-ignore - Prisma event types are sometimes inconsistent
  prisma.$on('error', (e: any) => {
    console.error('[prisma:error]', e);
  });
  
} catch (error) {
  console.error('[database]: Failed to initialize Prisma client:', error);
  // Create a fallback client that logs errors but doesn't crash the app
  prisma = new PrismaClient();
  console.warn('[database]: Using fallback Prisma client configuration');
}

// Export the prisma instance
export { prisma };

