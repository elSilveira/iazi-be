"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCategories = void 0;
const prisma_1 = require("../lib/prisma");
const cache_1 = require("../utils/cache"); // Import cache utility
const CATEGORIES_CACHE_KEY = "all_categories";
// Get all categories with caching
const getAllCategories = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1. Check cache first
        const cachedCategories = (0, cache_1.getFromCache)(CATEGORIES_CACHE_KEY);
        if (cachedCategories) {
            console.log("Serving categories from cache");
            res.json(cachedCategories);
            return;
        }
        // 2. If not in cache, fetch from DB
        console.log("Fetching categories from database");
        const categories = yield prisma_1.prisma.category.findMany({
            orderBy: {
                name: 'asc'
            }
        });
        // 3. Store in cache before returning
        (0, cache_1.setInCache)(CATEGORIES_CACHE_KEY, categories); // Use default TTL from cache utility
        res.json(categories);
    }
    catch (error) {
        console.error("Error fetching categories:", error);
        next(error); // Pass error to the global error handler
    }
});
exports.getAllCategories = getAllCategories;
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
