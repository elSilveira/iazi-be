import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { getFromCache, setInCache, invalidateCache } from "../utils/cache"; // Import cache utility
import { Category } from "@prisma/client"; // Import Category type

const CATEGORIES_CACHE_KEY = "all_categories";

// Get all categories with caching
export const getAllCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Check cache first
    const cachedCategories = getFromCache<Category[]>(CATEGORIES_CACHE_KEY);
    if (cachedCategories) {
      console.log("Serving categories from cache");
      res.json(cachedCategories);
      return;
    }

    // 2. If not in cache, fetch from DB
    console.log("Fetching categories from database");
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    // 3. Store in cache before returning
    setInCache(CATEGORIES_CACHE_KEY, categories); // Use default TTL from cache utility

    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    next(error); // Pass error to the global error handler
  }
};

// Placeholder for createCategory - needs cache invalidation
// export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   try {
//     // ... creation logic ...
//     invalidateCache(CATEGORIES_CACHE_KEY); // Invalidate cache on create
//     res.status(201).json(newCategory);
//   } catch (error) {
//     next(error);
//   }
// };

// Placeholder for updateCategory - needs cache invalidation
// export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   try {
//     // ... update logic ...
//     invalidateCache(CATEGORIES_CACHE_KEY); // Invalidate cache on update
//     res.json(updatedCategory);
//   } catch (error) {
//     next(error);
//   }
// };

// Placeholder for deleteCategory - needs cache invalidation
// export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   try {
//     // ... delete logic ...
//     invalidateCache(CATEGORIES_CACHE_KEY); // Invalidate cache on delete
//     res.status(200).json({ message: "Category deleted" });
//   } catch (error) {
//     next(error);
//   }
// };

