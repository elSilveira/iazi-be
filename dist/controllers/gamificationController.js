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
exports.getLeaderboard = exports.getGamificationProfile = void 0;
const prismaClient_1 = require("../utils/prismaClient");
const client_1 = require("@prisma/client");
// Helper function for UUID validation
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
};
// Get Gamification Profile for a User
const getGamificationProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let targetUserId = req.params.userId;
    const authenticatedUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const authenticatedUserRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    // If "me" is used, get the authenticated user's profile
    if (targetUserId === "me") {
        if (!authenticatedUserId) {
            res.status(401).json({ message: "Não autenticado." });
            return;
        }
        targetUserId = authenticatedUserId;
    }
    else if (!isValidUUID(targetUserId)) {
        res.status(400).json({ message: "Formato de ID do usuário inválido." });
        return;
    }
    // Authorization: Allow users to see their own profile, or admins to see any profile
    if (targetUserId !== authenticatedUserId && authenticatedUserRole !== client_1.UserRole.ADMIN) {
        res.status(403).json({ message: "Não autorizado a ver este perfil de gamificação." });
        return;
    }
    try {
        const profile = yield prismaClient_1.prisma.gamificationProfile.findUnique({
            where: { userId: targetUserId },
            include: {
                user: { select: { id: true, name: true, avatar: true } }, // Include basic user info
                badges: {
                    include: {
                        badge: true // Include details of the badge itself
                    }
                }
            }
        });
        if (!profile) {
            // If profile doesn't exist yet, maybe create a default one or return empty state?
            // For now, return 404, but consider creating on first relevant event.
            // Let's try returning a default structure if the user exists but profile doesn't
            const userExists = yield prismaClient_1.prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, name: true, avatar: true } });
            if (userExists) {
                res.json({
                    userId: targetUserId,
                    points: 0,
                    level: 1, // Default level
                    createdAt: new Date(), // Placeholder
                    updatedAt: new Date(), // Placeholder
                    user: userExists,
                    badges: []
                });
            }
            else {
                res.status(404).json({ message: "Perfil de gamificação ou usuário não encontrado." });
            }
            return;
        }
        // Calculate level based on points (example logic)
        // const level = Math.floor(profile.points / 100) + 1; // Example: 100 points per level
        // profile.level = level; // Add level dynamically if not stored or needs recalculation
        res.json(profile);
    }
    catch (error) {
        console.error(`Erro ao buscar perfil de gamificação para ${targetUserId}:`, error);
        next(error);
    }
});
exports.getGamificationProfile = getGamificationProfile;
// Get Gamification Leaderboard
const getLeaderboard = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit = 10 } = req.query; // Default limit to 10
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
        res.status(400).json({ message: "Parâmetro 'limit' inválido. Deve ser um número positivo." });
        return;
    }
    try {
        const leaderboard = yield prismaClient_1.prisma.gamificationProfile.findMany({
            orderBy: {
                points: 'desc'
            },
            take: parsedLimit,
            include: {
                user: { select: { id: true, name: true, avatar: true } } // Include basic user info
            }
        });
        res.json(leaderboard);
    }
    catch (error) {
        console.error("Erro ao buscar leaderboard:", error);
        next(error);
    }
});
exports.getLeaderboard = getLeaderboard;
