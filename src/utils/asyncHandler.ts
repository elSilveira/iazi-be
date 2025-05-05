import { Request, Response, NextFunction, RequestHandler } from "express";

// Utility function to wrap async route handlers and catch errors
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

