// src/types/express/index.d.ts
import { UserRole } from '@prisma/client'; // Assuming UserRole enum exists in Prisma schema

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole; // Add the role property
      };
    }
  }
}

// Export an empty object to make this file a module
export {};

