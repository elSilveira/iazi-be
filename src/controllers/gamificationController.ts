import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prismaClient";
import { UserRole } from "@prisma/client";

// Helper function for UUID validation
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
};

// Get Gamification Profile for a User
export const getGamificationProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let targetUserId = req.params.userId;
    const authenticatedUserId = req.user?.id;
    const authenticatedUserRole = req.user?.role;

    // If "me" is used, get the authenticated user's profile
    if (targetUserId === "me") {
        if (!authenticatedUserId) {
            res.status(401).json({ message: "Não autenticado." });
            return;
        }
        targetUserId = authenticatedUserId;
    } else if (!isValidUUID(targetUserId)) {
        res.status(400).json({ message: "Formato de ID do usuário inválido." });
        return;
    }

    // Authorization: Allow users to see their own profile, or admins to see any profile
    if (targetUserId !== authenticatedUserId && authenticatedUserRole !== UserRole.ADMIN) {
        res.status(403).json({ message: "Não autorizado a ver este perfil de gamificação." });
        return;
    }

    try {
        const profile = await prisma.gamificationProfile.findUnique({
            where: { userId: targetUserId },
            include: {
                user: { select: { id: true, name: true, avatar: true } }, // Include basic user info
                badges: { // Include badges earned by the user
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
            const userExists = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, name: true, avatar: true } });
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
            } else {
                res.status(404).json({ message: "Perfil de gamificação ou usuário não encontrado." });
            }
            return;
        }

        // Calculate level based on points (example logic)
        // const level = Math.floor(profile.points / 100) + 1; // Example: 100 points per level
        // profile.level = level; // Add level dynamically if not stored or needs recalculation

        res.json(profile);
    } catch (error) {
        console.error(`Erro ao buscar perfil de gamificação para ${targetUserId}:`, error);
        next(error);
    }
};

// Get Gamification Leaderboard
export const getLeaderboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { limit = 10 } = req.query; // Default limit to 10
    const parsedLimit = parseInt(limit as string, 10);

    if (isNaN(parsedLimit) || parsedLimit <= 0) {
        res.status(400).json({ message: "Parâmetro 'limit' inválido. Deve ser um número positivo." });
        return;
    }

    try {
        const leaderboard = await prisma.gamificationProfile.findMany({
            orderBy: {
                points: 'desc'
            },
            take: parsedLimit,
            include: {
                user: { select: { id: true, name: true, avatar: true } } // Include basic user info
            }
        });

        res.json(leaderboard);
    } catch (error) {
        console.error("Erro ao buscar leaderboard:", error);
        next(error);
    }
};

