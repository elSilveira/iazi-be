import {
    gamificationService,
    GamificationEventType,
    POINTS_CONFIG,
    BADGE_CONFIG
} from "../services/gamificationService";
import { prisma } from "../utils/prismaClient";
import { User, Badge, UserBadge, GamificationEvent } from "@prisma/client";

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
        },
        userBadge: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        gamificationEvent: {
            create: jest.fn(),
        },
        $transaction: jest.fn(async (callback) => await callback(prisma)), // Mock transaction
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
        role: "USER",
        points: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    describe("addPoints", () => {
        it("should add points to user and create event", async () => {
            const pointsToAdd = POINTS_CONFIG[GamificationEventType.APPOINTMENT_COMPLETED];
            const eventType = GamificationEventType.APPOINTMENT_COMPLETED;
            const relatedEntity = { id: "appt-456", type: "Appointment" };

            (prisma.user.update as jest.Mock).mockResolvedValueOnce({ ...mockUser, points: mockUser.points + pointsToAdd });
            (prisma.gamificationEvent.create as jest.Mock).mockResolvedValueOnce({}); // Mock event creation

            await gamificationService.addPoints(mockUserId, eventType, relatedEntity);

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: mockUserId },
                data: {
                    points: {
                        increment: pointsToAdd,
                    },
                },
            });
            expect(prisma.gamificationEvent.create).toHaveBeenCalledWith({
                data: {
                    userId: mockUserId,
                    eventType: eventType,
                    pointsAwarded: pointsToAdd,
                    relatedEntityId: relatedEntity.id,
                    relatedEntityType: relatedEntity.type,
                },
            });
        });

        it("should handle event types with zero points", async () => {
            const eventType = GamificationEventType.USER_REGISTERED; // Assuming 0 points
            await gamificationService.addPoints(mockUserId, eventType);

            // Expect user.update NOT to be called if points are 0
            expect(prisma.user.update).not.toHaveBeenCalled();
            // Expect event creation still to happen (or not, depending on desired logic for 0 points)
            // Assuming we still log 0 point events:
            expect(prisma.gamificationEvent.create).toHaveBeenCalledWith({
                data: {
                    userId: mockUserId,
                    eventType: eventType,
                    pointsAwarded: 0,
                    relatedEntityId: undefined,
                    relatedEntityType: undefined,
                },
            });
        });

        it("should throw error if user update fails", async () => {
            const pointsToAdd = POINTS_CONFIG[GamificationEventType.APPOINTMENT_COMPLETED];
            const eventType = GamificationEventType.APPOINTMENT_COMPLETED;
            (prisma.user.update as jest.Mock).mockRejectedValueOnce(new Error("DB error"));

            await expect(gamificationService.addPoints(mockUserId, eventType)).rejects.toThrow("Failed to add points or log event");
            expect(prisma.gamificationEvent.create).not.toHaveBeenCalled(); // Event should not be created if points fail
        });
    });

    describe("awardBadge", () => {
        const badgeKey = "FIRST_APPOINTMENT_COMPLETED";
        const mockBadge: Badge = {
            id: "badge-abc",
            name: BADGE_CONFIG[badgeKey].name,
            description: BADGE_CONFIG[badgeKey].description,
            iconUrl: null,
            pointsThreshold: null,
            eventTrigger: badgeKey,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        it("should award a badge if user doesn't have it", async () => {
            (prisma.badge.findUnique as jest.Mock).mockResolvedValueOnce(mockBadge);
            (prisma.userBadge.findUnique as jest.Mock).mockResolvedValueOnce(null); // User doesn't have the badge
            (prisma.userBadge.create as jest.Mock).mockResolvedValueOnce({}); // Mock badge award

            await gamificationService.awardBadge(mockUserId, badgeKey);

            expect(prisma.badge.findUnique).toHaveBeenCalledWith({ where: { eventTrigger: badgeKey } });
            expect(prisma.userBadge.findUnique).toHaveBeenCalledWith({ where: { userId_badgeId: { userId: mockUserId, badgeId: mockBadge.id } } });
            expect(prisma.userBadge.create).toHaveBeenCalledWith({ data: { userId: mockUserId, badgeId: mockBadge.id } });
        });

        it("should not award a badge if user already has it", async () => {
            (prisma.badge.findUnique as jest.Mock).mockResolvedValueOnce(mockBadge);
            (prisma.userBadge.findUnique as jest.Mock).mockResolvedValueOnce({}); // User already has the badge

            await gamificationService.awardBadge(mockUserId, badgeKey);

            expect(prisma.badge.findUnique).toHaveBeenCalledWith({ where: { eventTrigger: badgeKey } });
            expect(prisma.userBadge.findUnique).toHaveBeenCalledWith({ where: { userId_badgeId: { userId: mockUserId, badgeId: mockBadge.id } } });
            expect(prisma.userBadge.create).not.toHaveBeenCalled();
        });

        it("should not award if badge config doesn't exist", async () => {
            const invalidBadgeKey = "NON_EXISTENT_BADGE";
            await gamificationService.awardBadge(mockUserId, invalidBadgeKey as any);

            expect(prisma.badge.findUnique).not.toHaveBeenCalled();
            expect(prisma.userBadge.findUnique).not.toHaveBeenCalled();
            expect(prisma.userBadge.create).not.toHaveBeenCalled();
        });

        it("should not award if badge not found in DB", async () => {
            (prisma.badge.findUnique as jest.Mock).mockResolvedValueOnce(null); // Badge not in DB

            await gamificationService.awardBadge(mockUserId, badgeKey);

            expect(prisma.badge.findUnique).toHaveBeenCalledWith({ where: { eventTrigger: badgeKey } });
            expect(prisma.userBadge.findUnique).not.toHaveBeenCalled();
            expect(prisma.userBadge.create).not.toHaveBeenCalled();
        });

         it("should handle errors during badge awarding", async () => {
            (prisma.badge.findUnique as jest.Mock).mockResolvedValueOnce(mockBadge);
            (prisma.userBadge.findUnique as jest.Mock).mockResolvedValueOnce(null);
            (prisma.userBadge.create as jest.Mock).mockRejectedValueOnce(new Error("DB error"));

            // Expect error to be logged, but not necessarily thrown (depends on desired behavior)
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            await gamificationService.awardBadge(mockUserId, badgeKey);
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Error awarding badge"), expect.any(Error));
            consoleErrorSpy.mockRestore();
        });
    });

    describe("checkAndAwardPointBasedBadges", () => {
        const pointsBadgeKey = "POINTS_MASTER"; // Assuming a badge triggered by points
        const mockPointsBadge: Badge = {
            id: "badge-xyz",
            name: BADGE_CONFIG[pointsBadgeKey]?.name ?? "Points Master",
            description: BADGE_CONFIG[pointsBadgeKey]?.description ?? "Achieved points threshold",
            iconUrl: null,
            pointsThreshold: 100,
            eventTrigger: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        beforeAll(() => {
            // Add a points-based badge to the config for testing
            BADGE_CONFIG[pointsBadgeKey] = { name: "Points Master", description: "Achieved 100 points", pointsThreshold: 100 };
        });

        afterAll(() => {
            // Clean up the added badge config
            delete BADGE_CONFIG[pointsBadgeKey];
        });

        it("should award a points-based badge if threshold met and user doesn't have it", async () => {
            const userWithEnoughPoints = { ...mockUser, points: 105 };
            (prisma.badge.findMany as jest.Mock).mockResolvedValueOnce([mockPointsBadge]); // Find points badges
            (prisma.userBadge.findUnique as jest.Mock).mockResolvedValueOnce(null); // User doesn't have it
            (prisma.userBadge.create as jest.Mock).mockResolvedValueOnce({}); // Mock award

            await gamificationService.checkAndAwardPointBasedBadges(mockUserId, userWithEnoughPoints.points);

            expect(prisma.badge.findMany).toHaveBeenCalledWith({ where: { pointsThreshold: { not: null } } });
            expect(prisma.userBadge.findUnique).toHaveBeenCalledWith({ where: { userId_badgeId: { userId: mockUserId, badgeId: mockPointsBadge.id } } });
            expect(prisma.userBadge.create).toHaveBeenCalledWith({ data: { userId: mockUserId, badgeId: mockPointsBadge.id } });
        });

        it("should not award a points-based badge if threshold not met", async () => {
            const userWithNotEnoughPoints = { ...mockUser, points: 95 };
            (prisma.badge.findMany as jest.Mock).mockResolvedValueOnce([mockPointsBadge]); // Find points badges

            await gamificationService.checkAndAwardPointBasedBadges(mockUserId, userWithNotEnoughPoints.points);

            expect(prisma.badge.findMany).toHaveBeenCalledWith({ where: { pointsThreshold: { not: null } } });
            expect(prisma.userBadge.findUnique).not.toHaveBeenCalled();
            expect(prisma.userBadge.create).not.toHaveBeenCalled();
        });

        it("should not award a points-based badge if user already has it", async () => {
            const userWithEnoughPoints = { ...mockUser, points: 105 };
            (prisma.badge.findMany as jest.Mock).mockResolvedValueOnce([mockPointsBadge]); // Find points badges
            (prisma.userBadge.findUnique as jest.Mock).mockResolvedValueOnce({}); // User already has it

            await gamificationService.checkAndAwardPointBasedBadges(mockUserId, userWithEnoughPoints.points);

            expect(prisma.badge.findMany).toHaveBeenCalledWith({ where: { pointsThreshold: { not: null } } });
            expect(prisma.userBadge.findUnique).toHaveBeenCalledWith({ where: { userId_badgeId: { userId: mockUserId, badgeId: mockPointsBadge.id } } });
            expect(prisma.userBadge.create).not.toHaveBeenCalled();
        });

         it("should handle errors during point-based badge check", async () => {
            (prisma.badge.findMany as jest.Mock).mockRejectedValueOnce(new Error("DB error"));

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            await gamificationService.checkAndAwardPointBasedBadges(mockUserId, 105);
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Error checking point-based badges"), expect.any(Error));
            consoleErrorSpy.mockRestore();
        });
    });

    describe("triggerEvent", () => {
        it("should call addPoints and awardBadge for event-triggered badges", async () => {
            const eventType = GamificationEventType.FIRST_APPOINTMENT_COMPLETED;
            const badgeKey = "FIRST_APPOINTMENT_COMPLETED";
            const pointsToAdd = POINTS_CONFIG[eventType] ?? 0;
            const mockBadge: Badge = { id: "badge-abc", name: "First Timer", description: "...", iconUrl: null, pointsThreshold: null, eventTrigger: badgeKey, createdAt: new Date(), updatedAt: new Date() };

            // Mock necessary calls within addPoints and awardBadge
            (prisma.user.update as jest.Mock).mockResolvedValueOnce({ ...mockUser, points: mockUser.points + pointsToAdd });
            (prisma.gamificationEvent.create as jest.Mock).mockResolvedValueOnce({});
            (prisma.badge.findUnique as jest.Mock).mockResolvedValueOnce(mockBadge);
            (prisma.userBadge.findUnique as jest.Mock).mockResolvedValueOnce(null);
            (prisma.userBadge.create as jest.Mock).mockResolvedValueOnce({});
            // Mock findMany for point-based badges (assume none are awarded)
            (prisma.badge.findMany as jest.Mock).mockResolvedValueOnce([]);

            await gamificationService.triggerEvent(mockUserId, eventType);

            // Verify addPoints was effectively called
            expect(prisma.user.update).toHaveBeenCalled();
            expect(prisma.gamificationEvent.create).toHaveBeenCalled();
            // Verify awardBadge was called for the specific event trigger
            expect(prisma.badge.findUnique).toHaveBeenCalledWith({ where: { eventTrigger: badgeKey } });
            expect(prisma.userBadge.create).toHaveBeenCalledWith({ data: { userId: mockUserId, badgeId: mockBadge.id } });
            // Verify checkAndAwardPointBasedBadges was called
            expect(prisma.badge.findMany).toHaveBeenCalledWith({ where: { pointsThreshold: { not: null } } });
        });

        it("should call addPoints and checkAndAwardPointBasedBadges even if no event-triggered badge exists", async () => {
             const eventType = GamificationEventType.APPOINTMENT_COMPLETED; // No specific event badge
             const pointsToAdd = POINTS_CONFIG[eventType] ?? 0;

             (prisma.user.update as jest.Mock).mockResolvedValueOnce({ ...mockUser, points: mockUser.points + pointsToAdd });
             (prisma.gamificationEvent.create as jest.Mock).mockResolvedValueOnce({});
             // Mock findUnique for event badge (returns null)
             (prisma.badge.findUnique as jest.Mock).mockResolvedValueOnce(null);
             // Mock findMany for point-based badges
             (prisma.badge.findMany as jest.Mock).mockResolvedValueOnce([]);

             await gamificationService.triggerEvent(mockUserId, eventType);

             expect(prisma.user.update).toHaveBeenCalled();
             expect(prisma.gamificationEvent.create).toHaveBeenCalled();
             expect(prisma.badge.findUnique).toHaveBeenCalledWith({ where: { eventTrigger: eventType } }); // Still checks
             expect(prisma.userBadge.create).not.toHaveBeenCalled(); // No event badge awarded
             expect(prisma.badge.findMany).toHaveBeenCalledWith({ where: { pointsThreshold: { not: null } } });
        });

        it("should handle transactions correctly", async () => {
            const eventType = GamificationEventType.APPOINTMENT_COMPLETED;
            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                // Simulate the callback being executed with the mocked prisma client
                return await callback(prisma);
            });
            // Mocks for calls inside the transaction
            (prisma.user.update as jest.Mock).mockResolvedValueOnce({ ...mockUser, points: mockUser.points + POINTS_CONFIG[eventType] });
            (prisma.gamificationEvent.create as jest.Mock).mockResolvedValueOnce({});
            (prisma.badge.findUnique as jest.Mock).mockResolvedValueOnce(null);
            (prisma.badge.findMany as jest.Mock).mockResolvedValueOnce([]);

            await gamificationService.triggerEvent(mockUserId, eventType);

            expect(prisma.$transaction).toHaveBeenCalled();
            // Check if mocks inside transaction were called
            expect(prisma.user.update).toHaveBeenCalled();
            expect(prisma.gamificationEvent.create).toHaveBeenCalled();
            expect(prisma.badge.findUnique).toHaveBeenCalled();
            expect(prisma.badge.findMany).toHaveBeenCalled();
        });

        it("should handle errors within the transaction", async () => {
            const eventType = GamificationEventType.APPOINTMENT_COMPLETED;
            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                // Simulate an error during the transaction
                (prisma.user.update as jest.Mock).mockRejectedValueOnce(new Error("Transaction failed"));
                await expect(callback(prisma)).rejects.toThrow("Transaction failed");
            });

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            await gamificationService.triggerEvent(mockUserId, eventType);
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Gamification event trigger failed"), expect.any(Error));
            consoleErrorSpy.mockRestore();
        });
    });
});

