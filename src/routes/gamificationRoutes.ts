import { Router, Request, Response, NextFunction } from "express"; // Import Request, Response, NextFunction
import { getGamificationProfile, getLeaderboard } from "../controllers/gamificationController";
import { authMiddleware } from "../middlewares/authMiddleware"; // Corrected import path assuming it's in middlewares
import { asyncHandler } from "../utils/asyncHandler"; // Import asyncHandler

const router = Router();

// Apply authentication middleware to all gamification routes
router.use(asyncHandler(authMiddleware)); // Apply asyncHandler to async middleware

// Apply asyncHandler to all routes using async controller functions
router.get("/profile/me", asyncHandler(getGamificationProfile)); // Controller needs to get userId from req.user

router.get("/profile/:userId", asyncHandler(getGamificationProfile)); // Controller handles userId from params

router.get("/leaderboard", asyncHandler(getLeaderboard));

export default router; // Changed to default export

