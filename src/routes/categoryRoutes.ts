import { Router } from "express";
import { getAllCategories } from "../controllers/categoryController";
// import { authMiddleware } from "../middlewares/authMiddleware"; // Decide if categories need auth

const router = Router();

// Optional: Apply auth middleware if only logged-in users can see categories
// router.use(authMiddleware);

// Get all categories
router.get("/", getAllCategories);

// Potentially add routes for creating/updating/deleting categories later if needed
// router.post("/", createCategoryValidator, validateRequest, createCategory);
// router.put("/:id", updateCategoryValidator, validateRequest, updateCategory);
// router.delete("/:id", categoryIdValidator, validateRequest, deleteCategory);

export default router;

