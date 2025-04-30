import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

// Get all categories
export const getAllCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Assuming a 'Category' model exists in your Prisma schema
    const categories = await prisma.category.findMany({
      // Optionally add ordering, filtering, etc.
      orderBy: {
        name: 'asc' // Example: order by name alphabetically
      }
    });
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    next(error); // Pass error to the global error handler
  }
};

// Placeholder for createCategory if needed later
// export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => { ... };

// Placeholder for updateCategory if needed later
// export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => { ... };

// Placeholder for deleteCategory if needed later
// export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => { ... };

