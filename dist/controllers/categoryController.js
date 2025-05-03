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
// Get all categories
const getAllCategories = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Assuming a 'Category' model exists in your Prisma schema
        const categories = yield prisma_1.prisma.category.findMany({
            // Optionally add ordering, filtering, etc.
            orderBy: {
                name: 'asc' // Example: order by name alphabetically
            }
        });
        res.json(categories);
    }
    catch (error) {
        console.error("Error fetching categories:", error);
        next(error); // Pass error to the global error handler
    }
});
exports.getAllCategories = getAllCategories;
// Placeholder for createCategory if needed later
// export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => { ... };
// Placeholder for updateCategory if needed later
// export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => { ... };
// Placeholder for deleteCategory if needed later
// export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => { ... };
