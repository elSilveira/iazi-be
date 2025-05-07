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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const prisma_1 = require("../lib/prisma");
// Get notifications (Activity Logs) for the authenticated user
exports.getNotifications = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user is authenticated (added by authMiddleware)
    if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
    }
    const userId = req.user.id;
    try {
        const notifications = yield prisma_1.prisma.activityLog.findMany({
            where: {
                userId: userId,
            },
            orderBy: {
                createdAt: "desc", // Show newest first
            },
            // Add pagination if needed in the future
            // take: 10,
            // skip: 0, 
        });
        // Handle case where no notifications are found
        if (!notifications || notifications.length === 0) {
            return res.status(200).json([]); // Return empty array, not an error
        }
        res.status(200).json(notifications);
    }
    catch (error) {
        console.error("Erro ao buscar notificações:", error);
        // Generic error for the client
        res.status(500).json({ message: "Erro ao buscar notificações" });
    }
}));
// TODO: Add endpoint to mark notifications as read (requires schema update or logic)
// export const markAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => { ... });
