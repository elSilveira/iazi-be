import { Router } from "express";
import { getUserProfile, updateUserProfile } from "../controllers/userController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { updateUserValidator } from "../validators/userValidators"; // Assuming this validator will be created
import { validateRequest } from "../middlewares/validationMiddleware";

const router = Router();

// Apply auth middleware to all user routes
router.use(authMiddleware);

// Get current user's profile
router.get("/me", getUserProfile);

// Update current user's profile
router.put("/me", updateUserValidator, validateRequest, updateUserProfile);

export default router;

