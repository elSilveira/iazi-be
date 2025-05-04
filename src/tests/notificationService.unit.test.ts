import {
    createNotification,
    getUnreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} from "../services/notificationService";
import { prisma } from "../utils/prismaClient";
import { Notification, Prisma } from "@prisma/client";

// Mock Prisma client
jest.mock("../utils/prismaClient", () => ({
    prisma: {
        notification: {
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
        },
    },
}));

// Reset mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});

describe("Notification Service", () => {

    const mockUserId = "user-123";
    const mockNotificationId = "notif-abc";
    const mockRelatedEntity = { id: "appt-456", type: "Appointment" };
    const mockNotification: Notification = {
        id: mockNotificationId,
        userId: mockUserId,
        type: "APPOINTMENT_CONFIRMED",
        message: "Your appointment is confirmed",
        relatedEntityId: mockRelatedEntity.id,
        relatedEntityType: mockRelatedEntity.type,
        isRead: false,
        createdAt: new Date(),
    };

    describe("createNotification", () => {
        it("should create a notification with correct data", async () => {
            (prisma.notification.create as jest.Mock).mockResolvedValueOnce(mockNotification);

            const result = await createNotification(mockUserId, mockNotification.type, mockNotification.message, mockRelatedEntity);

            expect(prisma.notification.create).toHaveBeenCalledWith({
                data: {
                    userId: mockUserId,
                    type: mockNotification.type,
                    message: mockNotification.message,
                    relatedEntityId: mockRelatedEntity.id,
                    relatedEntityType: mockRelatedEntity.type,
                    isRead: false,
                },
            });
            expect(result).toEqual(mockNotification);
        });

        it("should create a notification without related entity", async () => {
            const notificationNoEntity = { ...mockNotification, relatedEntityId: null, relatedEntityType: null };
            (prisma.notification.create as jest.Mock).mockResolvedValueOnce(notificationNoEntity);

            const result = await createNotification(mockUserId, mockNotification.type, mockNotification.message, null);

            expect(prisma.notification.create).toHaveBeenCalledWith({
                data: {
                    userId: mockUserId,
                    type: mockNotification.type,
                    message: mockNotification.message,
                    relatedEntityId: undefined, // Prisma expects undefined for null optional fields
                    relatedEntityType: undefined,
                    isRead: false,
                },
            });
            expect(result).toEqual(notificationNoEntity);
        });

        it("should throw error if prisma create fails", async () => {
            const dbError = new Error("DB connection failed");
            (prisma.notification.create as jest.Mock).mockRejectedValueOnce(dbError);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            await expect(createNotification(mockUserId, mockNotification.type, mockNotification.message))
                .rejects.toThrow("Failed to create notification");
            expect(consoleErrorSpy).toHaveBeenCalledWith("Error creating notification:", dbError);
            consoleErrorSpy.mockRestore();
        });
    });

    describe("getUnreadNotifications", () => {
        const mockNotifications = [mockNotification, { ...mockNotification, id: "notif-def" }];
        const totalUnread = mockNotifications.length;

        it("should fetch unread notifications with default pagination", async () => {
            (prisma.notification.findMany as jest.Mock).mockResolvedValueOnce(mockNotifications);
            (prisma.notification.count as jest.Mock).mockResolvedValueOnce(totalUnread);

            const result = await getUnreadNotifications(mockUserId);

            expect(prisma.notification.findMany).toHaveBeenCalledWith({
                where: { userId: mockUserId, isRead: false },
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 10,
            });
            expect(prisma.notification.count).toHaveBeenCalledWith({
                where: { userId: mockUserId, isRead: false },
            });
            expect(result.data).toEqual(mockNotifications);
            expect(result.pagination).toEqual({
                page: 1,
                pageSize: 10,
                totalItems: totalUnread,
                totalPages: 1,
            });
        });

        it("should fetch unread notifications with specific pagination", async () => {
            const page = 2;
            const pageSize = 5;
            (prisma.notification.findMany as jest.Mock).mockResolvedValueOnce(mockNotifications);
            (prisma.notification.count as jest.Mock).mockResolvedValueOnce(totalUnread);

            const result = await getUnreadNotifications(mockUserId, page, pageSize);

            expect(prisma.notification.findMany).toHaveBeenCalledWith({
                where: { userId: mockUserId, isRead: false },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            });
            expect(prisma.notification.count).toHaveBeenCalledWith({
                where: { userId: mockUserId, isRead: false },
            });
            expect(result.pagination).toEqual({
                page: page,
                pageSize: pageSize,
                totalItems: totalUnread,
                totalPages: Math.ceil(totalUnread / pageSize),
            });
        });

        it("should throw error if prisma findMany fails", async () => {
            const dbError = new Error("DB findMany failed");
            (prisma.notification.findMany as jest.Mock).mockRejectedValueOnce(dbError);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            await expect(getUnreadNotifications(mockUserId)).rejects.toThrow("Failed to fetch notifications");
            expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching unread notifications:", dbError);
            expect(prisma.notification.count).not.toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it("should throw error if prisma count fails", async () => {
            const dbError = new Error("DB count failed");
            (prisma.notification.findMany as jest.Mock).mockResolvedValueOnce([]); // findMany succeeds
            (prisma.notification.count as jest.Mock).mockRejectedValueOnce(dbError);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            await expect(getUnreadNotifications(mockUserId)).rejects.toThrow("Failed to fetch notifications");
            expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching unread notifications:", dbError);
            consoleErrorSpy.mockRestore();
        });
    });

    describe("markNotificationAsRead", () => {
        const updatedNotification = { ...mockNotification, isRead: true };

        it("should mark a specific notification as read if found and belongs to user", async () => {
            (prisma.notification.findUnique as jest.Mock).mockResolvedValueOnce(mockNotification); // Found, belongs to user
            (prisma.notification.update as jest.Mock).mockResolvedValueOnce(updatedNotification);

            const result = await markNotificationAsRead(mockNotificationId, mockUserId);

            expect(prisma.notification.findUnique).toHaveBeenCalledWith({ where: { id: mockNotificationId } });
            expect(prisma.notification.update).toHaveBeenCalledWith({
                where: { id: mockNotificationId },
                data: { isRead: true },
            });
            expect(result).toEqual(updatedNotification);
        });

        it("should return the notification without updating if already read", async () => {
            const alreadyReadNotification = { ...mockNotification, isRead: true };
            (prisma.notification.findUnique as jest.Mock).mockResolvedValueOnce(alreadyReadNotification);

            const result = await markNotificationAsRead(mockNotificationId, mockUserId);

            expect(prisma.notification.findUnique).toHaveBeenCalledWith({ where: { id: mockNotificationId } });
            expect(prisma.notification.update).not.toHaveBeenCalled();
            expect(result).toEqual(alreadyReadNotification);
        });

        it("should throw 'Notification not found' if findUnique returns null", async () => {
            (prisma.notification.findUnique as jest.Mock).mockResolvedValueOnce(null);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            await expect(markNotificationAsRead(mockNotificationId, mockUserId))
                .rejects.toThrow("Notification not found");
            expect(prisma.notification.update).not.toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Error marking notification"), expect.any(Error));
            consoleErrorSpy.mockRestore();
        });

        it("should throw 'Unauthorized' if notification does not belong to user", async () => {
            const otherUserNotif = { ...mockNotification, userId: "other-user-456" };
            (prisma.notification.findUnique as jest.Mock).mockResolvedValueOnce(otherUserNotif);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            await expect(markNotificationAsRead(mockNotificationId, mockUserId))
                .rejects.toThrow("Unauthorized to mark this notification as read");
            expect(prisma.notification.update).not.toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Error marking notification"), expect.any(Error));
            consoleErrorSpy.mockRestore();
        });

        it("should throw generic error if update fails", async () => {
            const dbError = new Error("DB update failed");
            (prisma.notification.findUnique as jest.Mock).mockResolvedValueOnce(mockNotification);
            (prisma.notification.update as jest.Mock).mockRejectedValueOnce(dbError);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            await expect(markNotificationAsRead(mockNotificationId, mockUserId))
                .rejects.toThrow("Failed to mark notification as read");
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Error marking notification"), dbError);
            consoleErrorSpy.mockRestore();
        });
    });

    describe("markAllNotificationsAsRead", () => {
        it("should call updateMany with correct parameters", async () => {
            const updateResult = { count: 5 };
            (prisma.notification.updateMany as jest.Mock).mockResolvedValueOnce(updateResult);

            const result = await markAllNotificationsAsRead(mockUserId);

            expect(prisma.notification.updateMany).toHaveBeenCalledWith({
                where: {
                    userId: mockUserId,
                    isRead: false,
                },
                data: {
                    isRead: true,
                },
            });
            expect(result).toEqual(updateResult);
        });

        it("should return count 0 if no notifications were updated", async () => {
            const updateResult = { count: 0 };
            (prisma.notification.updateMany as jest.Mock).mockResolvedValueOnce(updateResult);

            const result = await markAllNotificationsAsRead(mockUserId);

            expect(prisma.notification.updateMany).toHaveBeenCalled();
            expect(result).toEqual(updateResult);
        });

        it("should throw error if updateMany fails", async () => {
            const dbError = new Error("DB updateMany failed");
            (prisma.notification.updateMany as jest.Mock).mockRejectedValueOnce(dbError);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            await expect(markAllNotificationsAsRead(mockUserId))
                .rejects.toThrow("Failed to mark all notifications as read");
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Error marking all notifications as read"), dbError);
            consoleErrorSpy.mockRestore();
        });
    });
});

