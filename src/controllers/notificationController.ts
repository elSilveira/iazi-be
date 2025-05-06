// src/controllers/notificationController.ts
import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../types/express";

// Get notifications (Activity Logs) for the authenticated user
export const getNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Check if user is authenticated (added by authMiddleware)
  if (!req.user) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }

  const userId = req.user.id;

  try {
    const notifications = await prisma.activityLog.findMany({
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

  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    // Generic error for the client
    res.status(500).json({ message: "Erro ao buscar notificações" });
  }
});

// TODO: Add endpoint to mark notifications as read (requires schema update or logic)
// export const markAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => { ... });

