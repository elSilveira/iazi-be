import { Request, Response, NextFunction } from "express";
import {
    getUnreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} from "../services/notificationService";
import { isValidUUID } from "../utils/validationUtils"; // Assuming a validation utility file exists

// Get unread notifications for the authenticated user
export const getUserNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.id;
    const { page = '1', pageSize = '10' } = req.query;

    if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado." });
        return;
    }

    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);

    if (isNaN(pageNum) || pageNum < 1 || isNaN(pageSizeNum) || pageSizeNum < 1) {
        res.status(400).json({ message: "Parâmetros de paginação inválidos (page e pageSize devem ser números positivos)." });
        return;
    }

    try {
        const notificationData = await getUnreadNotifications(userId, pageNum, pageSizeNum);
        res.json(notificationData);
    } catch (error) {
        console.error("Error fetching user notifications:", error);
        next(error); // Pass error to the central error handler
    }
};

// Mark a specific notification as read
export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.id;
    const { id: notificationId } = req.params;

    if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado." });
        return;
    }

    if (!isValidUUID(notificationId)) {
        res.status(400).json({ message: "Formato de ID da notificação inválido." });
        return;
    }

    try {
        const updatedNotification = await markNotificationAsRead(notificationId, userId);
        res.json(updatedNotification);
    } catch (error) {
        console.error(`Error marking notification ${notificationId} as read:`, error);
        if (error instanceof Error) {
            if (error.message === 'Notification not found') {
                res.status(404).json({ message: error.message });
                return;
            }
            if (error.message.startsWith('Unauthorized')) {
                res.status(403).json({ message: error.message });
                return;
            }
        }
        next(error); // Pass other errors to the central error handler
    }
};

// Mark all notifications for the user as read
export const markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado." });
        return;
    }

    try {
        const result = await markAllNotificationsAsRead(userId);
        res.json({ message: `${result.count} notificações marcadas como lidas.`, count: result.count });
    } catch (error) {
        console.error(`Error marking all notifications as read for user ${userId}:`, error);
        next(error); // Pass error to the central error handler
    }
};

