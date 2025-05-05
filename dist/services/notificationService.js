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
exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getUnreadNotifications = exports.createNotification = void 0;
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
/**
 * Creates a notification for a specific user.
 *
 * @param userId - The ID of the user to notify.
 * @param type - The type of notification (e.g., 'APPOINTMENT_CONFIRMED').
 * @param message - The notification message.
 * @param relatedEntity - Optional entity related to the notification.
 * @returns The created notification.
 */
const createNotification = (userId, type, message, relatedEntity) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notification = yield prismaClient_1.default.notification.create({
            data: {
                userId,
                type,
                message,
                relatedEntityId: relatedEntity === null || relatedEntity === void 0 ? void 0 : relatedEntity.id,
                relatedEntityType: relatedEntity === null || relatedEntity === void 0 ? void 0 : relatedEntity.type,
                isRead: false, // Notifications start as unread
            },
        });
        console.log(`Notification created: User ${userId}, Type: ${type}`);
        return notification;
    }
    catch (error) {
        console.error('Error creating notification:', error);
        // Depending on the context, you might want to throw the error
        // or handle it silently if notification failure is not critical.
        throw new Error('Failed to create notification');
    }
});
exports.createNotification = createNotification;
/**
 * Retrieves unread notifications for a given user with pagination.
 *
 * @param userId - The ID of the user.
 * @param page - The page number for pagination (default: 1).
 * @param pageSize - The number of items per page (default: 10).
 * @returns A list of unread notifications and pagination info.
 */
const getUnreadNotifications = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const take = pageSize;
    try {
        const where = {
            userId: userId,
            isRead: false,
        };
        const notifications = yield prismaClient_1.default.notification.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
            skip,
            take,
        });
        const totalUnread = yield prismaClient_1.default.notification.count({ where });
        return {
            data: notifications,
            pagination: {
                page,
                pageSize,
                totalItems: totalUnread,
                totalPages: Math.ceil(totalUnread / pageSize),
            },
        };
    }
    catch (error) {
        console.error('Error fetching unread notifications:', error);
        throw new Error('Failed to fetch notifications');
    }
});
exports.getUnreadNotifications = getUnreadNotifications;
/**
 * Marks a specific notification as read.
 *
 * @param notificationId - The ID of the notification to mark as read.
 * @param userId - The ID of the user who owns the notification (for authorization).
 * @returns The updated notification.
 * @throws Error if notification not found or user is not authorized.
 */
const markNotificationAsRead = (notificationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // First, find the notification to ensure it exists and belongs to the user
        const notification = yield prismaClient_1.default.notification.findUnique({
            where: { id: notificationId },
        });
        if (!notification) {
            throw new Error('Notification not found');
        }
        if (notification.userId !== userId) {
            // Prevent users from marking others' notifications as read
            throw new Error('Unauthorized to mark this notification as read');
        }
        // If already read, just return it
        if (notification.isRead) {
            return notification;
        }
        // Update the notification
        const updatedNotification = yield prismaClient_1.default.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
        return updatedNotification;
    }
    catch (error) {
        console.error(`Error marking notification ${notificationId} as read:`, error);
        if (error instanceof Error && (error.message === 'Notification not found' || error.message.startsWith('Unauthorized'))) {
            throw error; // Re-throw specific known errors
        }
        throw new Error('Failed to mark notification as read');
    }
});
exports.markNotificationAsRead = markNotificationAsRead;
/**
 * Marks all unread notifications for a user as read.
 *
 * @param userId - The ID of the user whose notifications should be marked as read.
 * @returns A count of the notifications updated.
 */
const markAllNotificationsAsRead = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield prismaClient_1.default.notification.updateMany({
            where: {
                userId: userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
        console.log(`Marked ${result.count} notifications as read for user ${userId}`);
        return result;
    }
    catch (error) {
        console.error(`Error marking all notifications as read for user ${userId}:`, error);
        throw new Error('Failed to mark all notifications as read');
    }
});
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
