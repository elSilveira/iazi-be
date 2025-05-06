// src/routes/notificationRoutes.ts
import { Router } from "express";
import { getNotifications } from "../controllers/notificationController";
import { authMiddleware } from "../middlewares/authMiddleware"; // Import auth middleware

const router = Router();

// GET /api/notifications - Fetch notifications for the authenticated user
// Requires authentication
router.get("/", authMiddleware, getNotifications);

// TODO: Add route for marking notifications as read
// router.patch("/:id/read", authMiddleware, markAsRead);

export default router;

