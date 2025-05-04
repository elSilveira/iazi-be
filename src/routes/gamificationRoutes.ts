import { Router } from "express";
import { getGamificationProfile, getLeaderboard } from "../controllers/gamificationController";
import { authenticateToken } from "../middleware/authMiddleware"; // Assuming auth middleware exists

const router = Router();

// GET /api/gamification/profile/me - Get authenticated user's profile
router.get("/profile/me", authenticateToken, getGamificationProfile);

// GET /api/gamification/profile/:userId - Get specific user's profile (requires auth, controller handles specific authorization)
router.get("/profile/:userId", authenticateToken, getGamificationProfile);

// GET /api/gamification/leaderboard - Get leaderboard (requires auth)
router.get("/leaderboard", authenticateToken, getLeaderboard);

export const gamificationRoutes = router;

