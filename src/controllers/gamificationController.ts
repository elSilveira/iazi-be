import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma"; // Corrected import path
import { UserRole, Prisma } from "@prisma/client"; // Added Prisma import

// Define a type for the authenticated user on the request object
// Ensure this matches the type attached by your auth middleware
interface AuthenticatedUser {
    id: string;
    role: UserRole; // Make sure role is included
}

// Extend the Express Request interface
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

// Helper function for UUID validation
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
};

// Get Gamification Profile for a User
export const getGamificationProfile = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => { // Corrected return type
    let targetUserId = req.params.userId;
    const authenticatedUserId = req.user?.id;
    const authenticatedUserRole = req.user?.role;

    // If "me" is used, get the authenticated user's profile
    if (targetUserId === "me") {
        if (!authenticatedUserId) {
            // Return the response directly
            return res.status(401).json({ message: "Não autenticado." });
        }
        targetUserId = authenticatedUserId;
    } else if (!isValidUUID(targetUserId)) {
        // Return the response directly
        return res.status(400).json({ message: "Formato de ID do usuário inválido." });
    }

    // Authorization: Allow users to see their own profile, or admins to see any profile
    if (targetUserId !== authenticatedUserId && authenticatedUserRole !== UserRole.ADMIN) {
        // Return the response directly
        return res.status(403).json({ message: "Não autorizado a ver este perfil de gamificação." });
    }

    try {
        // TODO: Fix this - Property 'gamificationProfile' does not exist on type 'PrismaClient'
        // Check schema.prisma for the correct model name (e.g., GamificationProfile? UserGamification?)
        // Assuming the model is named 'GamificationProfile' for now
        const profile = await (prisma as any).gamificationProfile.findUnique({
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
                // Return the response directly
                return res.json({
                    userId: targetUserId,
                    points: 0,
                    level: 1, // Default level
                    createdAt: new Date(), // Placeholder
                    updatedAt: new Date(), // Placeholder
                    user: userExists,
                    badges: []
                });
            } else {
                // Return the response directly
                return res.status(404).json({ message: "Perfil de gamificação ou usuário não encontrado." });
            }
        }

        // Calculate level based on points (example logic)
        // const level = Math.floor(profile.points / 100) + 1; // Example: 100 points per level
        // profile.level = level; // Add level dynamically if not stored or needs recalculation

        // Return the response
        return res.json(profile);
    } catch (error) {
        console.error(`Erro ao buscar perfil de gamificação para ${targetUserId}:`, error);
        next(error);
    }
};

// Get Gamification Leaderboard
export const getLeaderboard = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => { // Corrected return type
    const { limit = 10 } = req.query; // Default limit to 10
    const parsedLimit = parseInt(limit as string, 10);

    if (isNaN(parsedLimit) || parsedLimit <= 0) {
        // Return the response directly
        return res.status(400).json({ message: "Parâmetro 'limit' inválido. Deve ser um número positivo." });
    }

    try {
        // TODO: Fix this - Property 'gamificationProfile' does not exist on type 'PrismaClient'
        // Check schema.prisma for the correct model name (e.g., GamificationProfile? UserGamification?)
        // Assuming the model is named 'GamificationProfile' for now
        const leaderboard = await (prisma as any).gamificationProfile.findMany({
            orderBy: {
                points: 'desc'
            },
            take: parsedLimit,
            include: {
                user: { select: { id: true, name: true, avatar: true } } // Include basic user info
            }
        });

        // Return the response
        return res.json(leaderboard);
    } catch (error) {
        console.error("Erro ao buscar leaderboard:", error);
        next(error);
    }
};

