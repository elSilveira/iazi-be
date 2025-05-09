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
const gamificationService_1 = require("../services/gamificationService");
const prismaClient_1 = require("../utils/prismaClient");
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
        $transaction: jest.fn((callback) => __awaiter(void 0, void 0, void 0, function* () { return yield callback(prismaClient_1.prisma); })),
    },
}));
// Reset mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});
describe("Gamification Service", () => {
    const mockUserId = "user-123";
    const mockUser = {
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
    };
    // Mock Badge Definitions (similar to the ones in the service)
    const mockBadgeWelcome = {
        id: "badge-welcome", name: "Bem-Vindo(a)!", description: "...", iconUrl: null,
        pointsThreshold: null, eventTrigger: gamificationService_1.GamificationEventType.USER_REGISTERED,
        createdAt: new Date(), updatedAt: new Date(),
    };
    const mockBadgeFirstAppointment = {
        id: "badge-first-appt", name: "Primeiro Agendamento", description: "...", iconUrl: null,
        pointsThreshold: null, eventTrigger: gamificationService_1.GamificationEventType.APPOINTMENT_COMPLETED,
        createdAt: new Date(), updatedAt: new Date(),
    };
    const mockBadgePointsMaster = {
        id: "badge-points", name: "Mestre dos Pontos", description: "...", iconUrl: null,
        pointsThreshold: 100, eventTrigger: null,
        createdAt: new Date(), updatedAt: new Date(),
    };
    const mockAllBadges = [mockBadgeWelcome, mockBadgeFirstAppointment, mockBadgePointsMaster];
    // Mock EVENT_POINTS from the service
    const EVENT_POINTS = {
        [gamificationService_1.GamificationEventType.USER_REGISTERED]: 10,
        [gamificationService_1.GamificationEventType.APPOINTMENT_COMPLETED]: 5,
        [gamificationService_1.GamificationEventType.REVIEW_CREATED]: 3,
    };
    describe("triggerEvent", () => {
        it("should add points and check for badges on USER_REGISTERED event", () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const eventType = gamificationService_1.GamificationEventType.USER_REGISTERED;
            const pointsToAdd = (_a = EVENT_POINTS[eventType]) !== null && _a !== void 0 ? _a : 0;
            // Mocks for transaction
            prismaClient_1.prisma.user.findUnique.mockResolvedValueOnce(mockUser); // User exists
            prismaClient_1.prisma.gamificationEvent.create.mockResolvedValueOnce({}); // Event created
            prismaClient_1.prisma.user.update.mockResolvedValueOnce(Object.assign(Object.assign({}, mockUser), { points: mockUser.points + pointsToAdd })); // Points updated
            prismaClient_1.prisma.badge.findMany.mockResolvedValueOnce(mockAllBadges); // Fetch all badges
            prismaClient_1.prisma.userBadge.findMany.mockResolvedValueOnce([]); // User has no badges yet
            prismaClient_1.prisma.userBadge.create.mockResolvedValueOnce({}); // Award the welcome badge
            yield gamificationService_1.gamificationService.triggerEvent(mockUserId, eventType);
            // Verify addPoints logic was called within transaction
            expect(prismaClient_1.prisma.gamificationEvent.create).toHaveBeenCalledWith({
                data: {
                    userId: mockUserId,
                    eventType: eventType,
                    pointsAwarded: pointsToAdd,
                    referenceId: undefined,
                    details: { relatedEntityType: undefined },
                },
            });
            expect(prismaClient_1.prisma.user.update).toHaveBeenCalledWith({
                where: { id: mockUserId },
                data: { points: { increment: pointsToAdd } },
            });
            // Verify checkAndAwardBadges logic was called
            expect(prismaClient_1.prisma.badge.findMany).toHaveBeenCalledTimes(1);
            expect(prismaClient_1.prisma.userBadge.findMany).toHaveBeenCalledWith({ where: { userId: mockUserId }, select: { badgeId: true } });
            // Verify the welcome badge was awarded (based on eventTrigger)
            expect(prismaClient_1.prisma.userBadge.create).toHaveBeenCalledWith({
                data: { userId: mockUserId, badgeId: mockBadgeWelcome.id },
            });
        }));
        it("should award 'Primeiro Agendamento' badge only on the first APPOINTMENT_COMPLETED event", () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const eventType = gamificationService_1.GamificationEventType.APPOINTMENT_COMPLETED;
            const pointsToAdd = (_a = EVENT_POINTS[eventType]) !== null && _a !== void 0 ? _a : 0;
            const referenceId = "appt-1";
            // Mocks for first event
            prismaClient_1.prisma.user.findUnique.mockResolvedValueOnce(mockUser);
            prismaClient_1.prisma.gamificationEvent.create.mockResolvedValueOnce({});
            prismaClient_1.prisma.user.update.mockResolvedValueOnce(Object.assign(Object.assign({}, mockUser), { points: mockUser.points + pointsToAdd }));
            prismaClient_1.prisma.badge.findMany.mockResolvedValueOnce(mockAllBadges);
            prismaClient_1.prisma.userBadge.findMany.mockResolvedValueOnce([]); // No badges yet
            prismaClient_1.prisma.gamificationEvent.count.mockResolvedValueOnce(1); // First event of this type
            prismaClient_1.prisma.userBadge.create.mockResolvedValueOnce({}); // Award badge
            yield gamificationService_1.gamificationService.triggerEvent(mockUserId, eventType, { referenceId });
            expect(prismaClient_1.prisma.gamificationEvent.count).toHaveBeenCalledWith({
                where: { userId: mockUserId, eventType: mockBadgeFirstAppointment.eventTrigger },
            });
            expect(prismaClient_1.prisma.userBadge.create).toHaveBeenCalledWith({
                data: { userId: mockUserId, badgeId: mockBadgeFirstAppointment.id },
            });
            // Reset mocks for second event
            jest.clearAllMocks();
            // Mocks for second event
            const userAfterFirstEvent = Object.assign(Object.assign({}, mockUser), { points: mockUser.points + pointsToAdd });
            prismaClient_1.prisma.user.findUnique.mockResolvedValueOnce(userAfterFirstEvent);
            prismaClient_1.prisma.gamificationEvent.create.mockResolvedValueOnce({});
            prismaClient_1.prisma.user.update.mockResolvedValueOnce(Object.assign(Object.assign({}, userAfterFirstEvent), { points: userAfterFirstEvent.points + pointsToAdd }));
            prismaClient_1.prisma.badge.findMany.mockResolvedValueOnce(mockAllBadges);
            // User now has the first appointment badge
            prismaClient_1.prisma.userBadge.findMany.mockResolvedValueOnce([{ badgeId: mockBadgeFirstAppointment.id }]);
            prismaClient_1.prisma.gamificationEvent.count.mockResolvedValueOnce(2); // Second event of this type
            yield gamificationService_1.gamificationService.triggerEvent(mockUserId, eventType, { referenceId: "appt-2" });
            // Verify badge was NOT awarded again
            expect(prismaClient_1.prisma.gamificationEvent.count).toHaveBeenCalledWith({
                where: { userId: mockUserId, eventType: mockBadgeFirstAppointment.eventTrigger },
            });
            expect(prismaClient_1.prisma.userBadge.create).not.toHaveBeenCalled();
        }));
        it("should award 'Mestre dos Pontos' badge when points threshold is met", () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const eventType = gamificationService_1.GamificationEventType.APPOINTMENT_COMPLETED;
            const pointsToAdd = (_a = EVENT_POINTS[eventType]) !== null && _a !== void 0 ? _a : 0;
            const userWithHighPoints = Object.assign(Object.assign({}, mockUser), { points: 98 }); // Close to threshold
            const finalPoints = userWithHighPoints.points + pointsToAdd; // Will be 103
            // Mocks
            prismaClient_1.prisma.user.findUnique.mockResolvedValueOnce(userWithHighPoints);
            prismaClient_1.prisma.gamificationEvent.create.mockResolvedValueOnce({});
            prismaClient_1.prisma.user.update.mockResolvedValueOnce(Object.assign(Object.assign({}, userWithHighPoints), { points: finalPoints }));
            prismaClient_1.prisma.badge.findMany.mockResolvedValueOnce(mockAllBadges);
            prismaClient_1.prisma.userBadge.findMany.mockResolvedValueOnce([]); // No badges yet
            // Mock count for first appointment check (assume > 1)
            prismaClient_1.prisma.gamificationEvent.count.mockResolvedValueOnce(5);
            prismaClient_1.prisma.userBadge.create.mockResolvedValueOnce({}); // Award points badge
            yield gamificationService_1.gamificationService.triggerEvent(mockUserId, eventType);
            // Verify checkAndAwardBadges logic
            expect(prismaClient_1.prisma.badge.findMany).toHaveBeenCalledTimes(1);
            expect(prismaClient_1.prisma.userBadge.findMany).toHaveBeenCalledWith({ where: { userId: mockUserId }, select: { badgeId: true } });
            // Verify the points badge was awarded
            expect(prismaClient_1.prisma.userBadge.create).toHaveBeenCalledWith({
                data: { userId: mockUserId, badgeId: mockBadgePointsMaster.id },
            });
        }));
        it("should handle transaction errors gracefully", () => __awaiter(void 0, void 0, void 0, function* () {
            const eventType = gamificationService_1.GamificationEventType.APPOINTMENT_COMPLETED;
            const dbError = new Error("DB Transaction Error");
            // Mock transaction to throw an error
            prismaClient_1.prisma.$transaction.mockRejectedValueOnce(dbError);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            yield gamificationService_1.gamificationService.triggerEvent(mockUserId, eventType);
            // Verify error was logged
            expect(consoleErrorSpy).toHaveBeenCalledWith(`Error processing gamification event ${eventType} for user ${mockUserId}:`, dbError);
            // Verify no partial updates happened (mocks shouldn't be called if transaction fails early)
            expect(prismaClient_1.prisma.gamificationEvent.create).not.toHaveBeenCalled();
            expect(prismaClient_1.prisma.user.update).not.toHaveBeenCalled();
            expect(prismaClient_1.prisma.userBadge.create).not.toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        }));
        it("should not trigger event if user does not exist", () => __awaiter(void 0, void 0, void 0, function* () {
            const eventType = gamificationService_1.GamificationEventType.APPOINTMENT_COMPLETED;
            // Mock user findUnique to return null inside transaction
            prismaClient_1.prisma.user.findUnique.mockResolvedValueOnce(null);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            yield gamificationService_1.gamificationService.triggerEvent(mockUserId, eventType);
            expect(prismaClient_1.prisma.$transaction).toHaveBeenCalled();
            expect(prismaClient_1.prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: mockUserId } });
            // Verify error was logged
            expect(consoleErrorSpy).toHaveBeenCalledWith(`User ${mockUserId} not found. Cannot trigger gamification event.`);
            // Verify no further actions were taken
            expect(prismaClient_1.prisma.gamificationEvent.create).not.toHaveBeenCalled();
            expect(prismaClient_1.prisma.user.update).not.toHaveBeenCalled();
            expect(prismaClient_1.prisma.badge.findMany).not.toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        }));
    });
    describe("seedBadges", () => {
        it("should call prisma.badge.upsert for each badge definition", () => __awaiter(void 0, void 0, void 0, function* () {
            prismaClient_1.prisma.badge.upsert.mockResolvedValue({}); // Mock upsert success
            yield gamificationService_1.gamificationService.seedBadges();
            // Check if upsert was called for each badge in BADGE_DEFINITIONS (from the service)
            // We don't have direct access to BADGE_DEFINITIONS here, so check the count
            // Assuming BADGE_DEFINITIONS has 5 entries based on the service code provided
            expect(prismaClient_1.prisma.badge.upsert).toHaveBeenCalledTimes(5);
            // Check one specific call to ensure structure is correct
            expect(prismaClient_1.prisma.badge.upsert).toHaveBeenCalledWith({
                where: { name: "Bem-Vindo(a)!" },
                update: expect.any(Object),
                create: expect.objectContaining({ name: "Bem-Vindo(a)!" }),
            });
        }));
        it("should log errors if upsert fails", () => __awaiter(void 0, void 0, void 0, function* () {
            const upsertError = new Error("Upsert failed");
            prismaClient_1.prisma.badge.upsert.mockRejectedValueOnce(upsertError);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            yield gamificationService_1.gamificationService.seedBadges();
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Error seeding badge"), upsertError);
            // Ensure it continues trying to seed other badges
            expect(prismaClient_1.prisma.badge.upsert).toHaveBeenCalledTimes(5); // Still called 5 times
            consoleErrorSpy.mockRestore();
        }));
    });
});
