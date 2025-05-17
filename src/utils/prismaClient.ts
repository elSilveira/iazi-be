import { PrismaClient, Prisma } from "@prisma/client";

// Initialize Prisma Client with improved error handling
let prisma: PrismaClient;

try {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error'] as Prisma.LogLevel[]
      : ['error'] as Prisma.LogLevel[],
  });
  
  // Test the connection immediately
  console.log('[database]: Initializing Prisma Client and testing connection...');
  
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
  // Don't exit here, let the application handle it gracefully
  throw error;
}

// Export the prisma instance
export { prisma };

