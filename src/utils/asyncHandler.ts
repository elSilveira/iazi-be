import { Request, Response, NextFunction, RequestHandler } from "express";

// Define a type for the async function that asyncHandler wraps
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>; // Changed from Promise<any> to Promise<unknown>

// Higher-order function to catch errors from async route handlers
const asyncHandler =
  (fn: AsyncRequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;

