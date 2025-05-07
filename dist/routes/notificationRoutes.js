"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/notificationRoutes.ts
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const authMiddleware_1 = require("../middlewares/authMiddleware"); // Import auth middleware
const router = (0, express_1.Router)();
// GET /api/notifications - Fetch notifications for the authenticated user
// Requires authentication
router.get("/", authMiddleware_1.authMiddleware, notificationController_1.getNotifications);
// TODO: Add route for marking notifications as read
// router.patch("/:id/read", authMiddleware, markAsRead);
exports.default = router;
