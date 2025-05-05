"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express"); // Import Request, Response, NextFunction
const gamificationController_1 = require("../controllers/gamificationController");
const authMiddleware_1 = require("../middlewares/authMiddleware"); // Corrected import path assuming it's in middlewares
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler")); // Import asyncHandler
const router = (0, express_1.Router)();
// Apply authentication middleware to all gamification routes
router.use((0, asyncHandler_1.default)(authMiddleware_1.authMiddleware)); // Apply asyncHandler to async middleware
// Apply asyncHandler to all routes using async controller functions
router.get("/profile/me", (0, asyncHandler_1.default)(gamificationController_1.getGamificationProfile)); // Controller needs to get userId from req.user
router.get("/profile/:userId", (0, asyncHandler_1.default)(gamificationController_1.getGamificationProfile)); // Controller handles userId from params
router.get("/leaderboard", (0, asyncHandler_1.default)(gamificationController_1.getLeaderboard));
exports.default = router; // Changed to default export
