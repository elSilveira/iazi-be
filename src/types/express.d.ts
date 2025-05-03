import { Request } from 'express';

// Define a custom interface extending Express's Request
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    // Add other user properties if needed from the JWT payload
  };
  // Add other properties if needed, e.g., companyId for company-specific routes
}

