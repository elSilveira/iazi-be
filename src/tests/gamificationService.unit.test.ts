import {
    gamificationService,
    GamificationEventType,
} from "../services/gamificationService";
import { prisma } from "../utils/prismaClient";
import { User, Badge, UserBadge, GamificationEvent, Prisma } from "@prisma/client";

// Mock Prisma client
jest.mock("../utils/prismaClient", () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        badge: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            upsert: jest.fn(), // Added for seedBadges
        },
        userBadge: {
            findUnique: jest.fn(),
            findMany: jest.fn(), // Added for checkAndAwardBadges
            create: jest.fn(),
        },
        gamificationEvent: {
            create: jest.fn(),
            count: jest.fn(), // Added for checkAndAwardBadges
        },
        // Mock transaction: pass the mocked prisma client to the callback
        $transaction: jest.fn(async (callback) => await callback(prisma)),
    },
}));

// Reset mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});

describe("Gamification Service", () => {

    const mockUserId = "user-123";
    const mockUser: User = {
        id: mockUserId,
        email: "test@example.com",
        name: "Test User",
        password: "hashedpassword",
        avatar: null,
        bio: null,
        phone: null,
        role: "USER", // Assuming UserRole enum exists and USER is a valid value
        points: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        slug: "user-123"
    };

    // Mock Badge Definitions (similar to the ones in the service)
    const mockBadgeWelcome: Badge = {
        id: "badge-welcome", name: "Bem-Vindo(a)!", description: "...", iconUrl: null,
        pointsThreshold: null, eventTrigger: GamificationEventType.USER_REGISTERED,
        createdAt: new Date(), updatedAt: new Date(),
    };
    const mockBadgeFirstAppointment: Badge = {
        id: "badge-first-appt", name: "Primeiro Agendamento", description: "...", iconUrl: null,
        pointsThreshold: null, eventTrigger: GamificationEventType.APPOINTMENT_COMPLETED,
        createdAt: new Date(), updatedAt: new Date(),
    };
     const mockBadgePointsMaster: Badge = {
        id: "badge-points", name: "Mestre dos Pontos", description: "...", iconUrl: null,
        pointsThreshold: 100, eventTrigger: null,
        createdAt: new Date(), updatedAt: new Date(),
    };
    const mockAllBadges = [mockBadgeWelcome, mockBadgeFirstAppointment, mockBadgePointsMaster];

    // Mock EVENT_POINTS from the service
    const EVENT_POINTS: { [key in GamificationEventType]?: number } = {
        [GamificationEventType.USER_REGISTERED]: 10,
        [GamificationEventType.APPOINTMENT_COMPLETED]: 5,
        [GamificationEventType.REVIEW_CREATED]: 3,
    };

    describe("triggerEvent", () => {

        it("should add points and check for badges on USER_REGISTERED event", async () => {
            const eventType = GamificationEventType.USER_REGISTERED;
            const pointsToAdd = EVENT_POINTS[eventType] ?? 0;

            // Mocks for transaction
            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser); // User exists
            (prisma.gamificationEvent.create as jest.Mock).mockResolvedValueOnce({}); // Event created
            (prisma.user.update as jest.Mock).mockResolvedValueOnce({ ...mockUser, points: mockUser.points + pointsToAdd }); // Points updated
            (prisma.badge.findMany as jest.Mock).mockResolvedValueOnce(mockAllBadges); // Fetch all badges
            (prisma.userBadge.findMany as jest.Mock).mockResolvedValueOnce([]); // User has no badges yet
            (prisma.userBadge.create as jest.Mock).mockResolvedValueOnce({}); // Award the welcome badge

            await gamificationService.triggerEvent(mockUserId, eventType);

            // Verify addPoints logic was called within transaction
            expect(prisma.gamificationEvent.create).toHaveBeenCalledWith({
                data: {
                    userId: mockUserId,
                    eventType: eventType,
                    pointsAwarded: pointsToAdd,
                    referenceId: undefined,
                    details: { relatedEntityType: undefined },
                },
            });
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: mockUserId },
                data: { points: { increment: pointsToAdd } },
            });

            // Verify checkAndAwardBadges logic was called
            expect(prisma.badge.findMany).toHaveBeenCalledTimes(1);
            expect(prisma.userBadge.findMany).toHaveBeenCalledWith({ where: { userId: mockUserId }, select: { badgeId: true } });
            // Verify the welcome badge was awarded (based on eventTrigger)
            expect(prisma.userBadge.create).toHaveBeenCalledWith({
                data: { userId: mockUserId, badgeId: mockBadgeWelcome.id },
            });
        });

        it("should award 'Primeiro Agendamento' badge only on the first APPOINTMENT_COMPLETED event", async () => {
            const eventType = GamificationEventType.APPOINTMENT_COMPLETED;
            const pointsToAdd = EVENT_POINTS[eventType] ?? 0;
            const referenceId = "appt-1";

            // Mocks for first event
            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
            (prisma.gamificationEvent.create as jest.Mock).mockResolvedValueOnce({});
            (prisma.user.update as jest.Mock).mockResolvedValueOnce({ ...mockUser, points: mockUser.points + pointsToAdd });
            (prisma.badge.findMany as jest.Mock).mockResolvedValueOnce(mockAllBadges);
            (prisma.userBadge.findMany as jest.Mock).mockResolvedValueOnce([]); // No badges yet
            (prisma.gamificationEvent.count as jest.Mock).mockResolvedValueOnce(1); // First event of this type
            (prisma.userBadge.create as jest.Mock).mockResolvedValueOnce({}); // Award badge

            await gamificationService.triggerEvent(mockUserId, eventType, { referenceId });

            expect(prisma.gamificationEvent.count).toHaveBeenCalledWith({
                where: { userId: mockUserId, eventType: mockBadgeFirstAppointment.eventTrigger },
            });
            expect(prisma.userBadge.create).toHaveBeenCalledWith({
                data: { userId: mockUserId, badgeId: mockBadgeFirstAppointment.id },
            });

            // Reset mocks for second event
            jest.clearAllMocks();

            // Mocks for second event
            const userAfterFirstEvent = { ...mockUser, points: mockUser.points + pointsToAdd };
            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(userAfterFirstEvent);
            (prisma.gamificationEvent.create as jest.Mock).mockResolvedValueOnce({});
            (prisma.user.update as jest.Mock).mockResolvedValueOnce({ ...userAfterFirstEvent, points: userAfterFirstEvent.points + pointsToAdd });
            (prisma.badge.findMany as jest.Mock).mockResolvedValueOnce(mockAllBadges);
            // User now has the first appointment badge
            (prisma.userBadge.findMany as jest.Mock).mockResolvedValueOnce([{ badgeId: mockBadgeFirstAppointment.id }]);
            (prisma.gamificationEvent.count as jest.Mock).mockResolvedValueOnce(2); // Second event of this type

            await gamificationService.triggerEvent(mockUserId, eventType, { referenceId: "appt-2" });

            // Verify badge was NOT awarded again
            expect(prisma.gamificationEvent.count).toHaveBeenCalledWith({
                where: { userId: mockUserId, eventType: mockBadgeFirstAppointment.eventTrigger },
            });
            expect(prisma.userBadge.create).not.toHaveBeenCalled();
        });

        it("should award 'Mestre dos Pontos' badge when points threshold is met", async () => {
            const eventType = GamificationEventType.APPOINTMENT_COMPLETED;
            const pointsToAdd = EVENT_POINTS[eventType] ?? 0;
            const userWithHighPoints = { ...mockUser, points: 98 }; // Close to threshold
            const finalPoints = userWithHighPoints.points + pointsToAdd; // Will be 103

            // Mocks
            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(userWithHighPoints);
            (prisma.gamificationEvent.create as jest.Mock).mockResolvedValueOnce({});
            (prisma.user.update as jest.Mock).mockResolvedValueOnce({ ...userWithHighPoints, points: finalPoints });
            (prisma.badge.findMany as jest.Mock).mockResolvedValueOnce(mockAllBadges);
            (prisma.userBadge.findMany as jest.Mock).mockResolvedValueOnce([]); // No badges yet
            // Mock count for first appointment check (assume > 1)
            (prisma.gamificationEvent.count as jest.Mock).mockResolvedValueOnce(5);
            (prisma.userBadge.create as jest.Mock).mockResolvedValueOnce({}); // Award points badge

            await gamificationService.triggerEvent(mockUserId, eventType);

            // Verify checkAndAwardBadges logic
            expect(prisma.badge.findMany).toHaveBeenCalledTimes(1);
            expect(prisma.userBadge.findMany).toHaveBeenCalledWith({ where: { userId: mockUserId }, select: { badgeId: true } });
            // Verify the points badge was awarded
            expect(prisma.userBadge.create).toHaveBeenCalledWith({
                data: { userId: mockUserId, badgeId: mockBadgePointsMaster.id },
            });
        });

        it("should handle transaction errors gracefully", async () => {
            const eventType = GamificationEventType.APPOINTMENT_COMPLETED;
            const dbError = new Error("DB Transaction Error");

            // Mock transaction to throw an error
            (prisma.$transaction as jest.Mock).mockRejectedValueOnce(dbError);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            await gamificationService.triggerEvent(mockUserId, eventType);

            // Verify error was logged
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                `Error processing gamification event ${eventType} for user ${mockUserId}:`,
                dbError
            );
            // Verify no partial updates happened (mocks shouldn't be called if transaction fails early)
            expect(prisma.gamificationEvent.create).not.toHaveBeenCalled();
            expect(prisma.user.update).not.toHaveBeenCalled();
            expect(prisma.userBadge.create).not.toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });

         it("should not trigger event if user does not exist", async () => {
            const eventType = GamificationEventType.APPOINTMENT_COMPLETED;
            // Mock user findUnique to return null inside transaction
            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            await gamificationService.triggerEvent(mockUserId, eventType);

            expect(prisma.$transaction).toHaveBeenCalled();
            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: mockUserId } });
            // Verify error was logged
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                `User ${mockUserId} not found. Cannot trigger gamification event.`
            );
            // Verify no further actions were taken
            expect(prisma.gamificationEvent.create).not.toHaveBeenCalled();
            expect(prisma.user.update).not.toHaveBeenCalled();
            expect(prisma.badge.findMany).not.toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });

    describe("seedBadges", () => {
        it("should call prisma.badge.upsert for each badge definition", async () => {
            (prisma.badge.upsert as jest.Mock).mockResolvedValue({}); // Mock upsert success

            await gamificationService.seedBadges();

            // Check if upsert was called for each badge in BADGE_DEFINITIONS (from the service)
            // We don't have direct access to BADGE_DEFINITIONS here, so check the count
            // Assuming BADGE_DEFINITIONS has 5 entries based on the service code provided
            expect(prisma.badge.upsert).toHaveBeenCalledTimes(5);

            // Check one specific call to ensure structure is correct
            expect(prisma.badge.upsert).toHaveBeenCalledWith({
                where: { name: "Bem-Vindo(a)!" },
                update: expect.any(Object),
                create: expect.objectContaining({ name: "Bem-Vindo(a)!" }),
            });
        });

        it("should log errors if upsert fails", async () => {
            const upsertError = new Error("Upsert failed");
            (prisma.badge.upsert as jest.Mock).mockRejectedValueOnce(upsertError);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            await gamificationService.seedBadges();

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining("Error seeding badge"),
                upsertError
            );
            // Ensure it continues trying to seed other badges
            expect(prisma.badge.upsert).toHaveBeenCalledTimes(5); // Still called 5 times

            consoleErrorSpy.mockRestore();
        });
    });
});

