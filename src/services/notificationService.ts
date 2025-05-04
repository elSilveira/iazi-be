import prisma from '../utils/prismaClient';
import { Notification, Prisma } from '@prisma/client';

interface RelatedEntity {
  id: string;
  type: string;
}

/**
 * Creates a notification for a specific user.
 *
 * @param userId - The ID of the user to notify.
 * @param type - The type of notification (e.g., 'APPOINTMENT_CONFIRMED').
 * @param message - The notification message.
 * @param relatedEntity - Optional entity related to the notification.
 * @returns The created notification.
 */
export const createNotification = async (
  userId: string,
  type: string,
  message: string,
  relatedEntity?: RelatedEntity | null
): Promise<Notification> => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        relatedEntityId: relatedEntity?.id,
        relatedEntityType: relatedEntity?.type,
        isRead: false, // Notifications start as unread
      },
    });
    console.log(`Notification created: User ${userId}, Type: ${type}`);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    // Depending on the context, you might want to throw the error
    // or handle it silently if notification failure is not critical.
    throw new Error('Failed to create notification');
  }
};

/**
 * Retrieves unread notifications for a given user with pagination.
 *
 * @param userId - The ID of the user.
 * @param page - The page number for pagination (default: 1).
 * @param pageSize - The number of items per page (default: 10).
 * @returns A list of unread notifications and pagination info.
 */
export const getUnreadNotifications = async (
  userId: string,
  page: number = 1,
  pageSize: number = 10
) => {
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  try {
    const where: Prisma.NotificationWhereInput = {
      userId: userId,
      isRead: false,
    };

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });

    const totalUnread = await prisma.notification.count({ where });

    return {
      data: notifications,
      pagination: {
        page,
        pageSize,
        totalItems: totalUnread,
        totalPages: Math.ceil(totalUnread / pageSize),
      },
    };
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    throw new Error('Failed to fetch notifications');
  }
};

/**
 * Marks a specific notification as read.
 *
 * @param notificationId - The ID of the notification to mark as read.
 * @param userId - The ID of the user who owns the notification (for authorization).
 * @returns The updated notification.
 * @throws Error if notification not found or user is not authorized.
 */
export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
): Promise<Notification> => {
  try {
    // First, find the notification to ensure it exists and belongs to the user
    const notification = await prisma.notification.findUnique({
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
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
    return updatedNotification;
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    if (error instanceof Error && (error.message === 'Notification not found' || error.message.startsWith('Unauthorized'))) {
        throw error; // Re-throw specific known errors
    }
    throw new Error('Failed to mark notification as read');
  }
};

/**
 * Marks all unread notifications for a user as read.
 *
 * @param userId - The ID of the user whose notifications should be marked as read.
 * @returns A count of the notifications updated.
 */
export const markAllNotificationsAsRead = async (
  userId: string
): Promise<{ count: number }> => {
  try {
    const result = await prisma.notification.updateMany({
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
  } catch (error) {
    console.error(`Error marking all notifications as read for user ${userId}:`, error);
    throw new Error('Failed to mark all notifications as read');
  }
};

