import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../lib/errors'; // Assuming custom errors
import { prisma } from '../lib/prisma'; // Assuming prisma client
import { UserRole } from '@prisma/client'; // Import UserRole enum

// Define a type for the decoded JWT payload
interface JwtPayload {
  userId: string; // Keep userId here as it comes from the token payload
  role: UserRole; // Include role from the token
  iat: number;
  exp: number;
}

// No need for AuthenticatedRequest interface, rely on global augmentation in src/types/express/index.d.ts

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as JwtPayload;

      // Get user from the token payload (consider fetching from DB for validation)
      // For simplicity here, we trust the payload if the signature is valid.
      // In production, you might want to check if the user still exists or is active.
      /*
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }, // Use decoded.userId to find user by ID
        select: { id: true, role: true, isActive: true } // Select necessary fields
      });

      if (!user || !user.isActive) {
        next(new UnauthorizedError('User not found or inactive'));
        return;
      }
      */

      // Attach user info to the request object using the globally augmented type
      req.user = {
        id: decoded.userId, // Use 'id' to match global Express.Request type
        role: decoded.role, // Pass role from token
      };

      next(); // Proceed to the next middleware/controller
    } catch (error) {
      console.error('Token verification failed:', error);
      next(new UnauthorizedError('Not authorized, token failed'));
    }
  } else {
    next(new UnauthorizedError('Not authorized, no token'));
  }
};

// Optional: Middleware to check for specific roles
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => { // Use Request type
    if (!req.user || !roles.includes(req.user.role)) { // Access req.user.role (as defined globally)
      return next(new UnauthorizedError(`User role ${req.user?.role} is not authorized to access this route`));
    }
    next();
  };
};

