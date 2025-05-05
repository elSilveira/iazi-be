import { Request, Response, NextFunction } from "express";

// Dummy middleware for testing
export const dummyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  console.log("Dummy middleware executed");
  next();
};

