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
exports.gamificationService = exports.GamificationEventType = void 0;
const prisma_1 = require("../lib/prisma");
// Define Gamification Event Types
var GamificationEventType;
(function (GamificationEventType) {
    GamificationEventType["USER_REGISTERED"] = "USER_REGISTERED";
    GamificationEventType["APPOINTMENT_BOOKED"] = "APPOINTMENT_BOOKED";
    GamificationEventType["APPOINTMENT_COMPLETED"] = "APPOINTMENT_COMPLETED";
    GamificationEventType["REVIEW_CREATED"] = "REVIEW_CREATED";
    // Add more event types as needed
})(GamificationEventType || (exports.GamificationEventType = GamificationEventType = {}));
// Define points awarded for each event type
const EVENT_POINTS = {
    [GamificationEventType.USER_REGISTERED]: 10,
    [GamificationEventType.APPOINTMENT_COMPLETED]: 5,
    [GamificationEventType.REVIEW_CREATED]: 3,
};
const BADGE_DEFINITIONS = [
    {
        name: "Bem-Vindo(a)!",
        description: "Registrou-se na plataforma.",
        eventTrigger: GamificationEventType.USER_REGISTERED,
    },
    {
        name: "Primeiro Agendamento",
        description: "Completou seu primeiro agendamento.",
        eventTrigger: GamificationEventType.APPOINTMENT_COMPLETED, // Logic checks count=1
    },
    {
        name: "Avaliador Iniciante",
        description: "Deixou sua primeira avaliação.",
        eventTrigger: GamificationEventType.REVIEW_CREATED, // Logic checks count=1
    },
    {
        name: "Cliente Frequente",
        description: "Completou 5 agendamentos.",
        eventTrigger: GamificationEventType.APPOINTMENT_COMPLETED, // Logic checks count>=5
    },
    {
        name: "Mestre dos Pontos",
        description: "Alcançou 100 pontos.",
        pointsThreshold: 100,
    },
];
class GamificationService {
    /**
     * Adds points to a user and records the gamification event.
     * Runs within a transaction.
     * @param tx Prisma Transaction Client
     * @param userId ID of the user
     * @param points Points to add
     * @param eventType The type of event triggering the points
     */
    addPoints(tx, userId, points, eventType) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Adding ${points} points to user ${userId} for event ${eventType}`);
            // Record the event first
            yield tx.gamificationEvent.create({
                data: {
                    userId,
                    eventType,
                    pointsAwarded: points,
                },
            });
            // Update user points directly on the User model
            const updatedUser = yield tx.user.update({
                where: { id: userId },
                data: {
                    points: {
                        increment: points,
                    },
                },
            });
            console.log(`User ${userId} now has ${updatedUser.points} points`);
            return updatedUser;
        });
    }
    /**
     * Awards a badge to a user if they haven\'t received it already.
     * Runs within a transaction.
     * @param tx Prisma Transaction Client
     * @param userId ID of the user
     * @param badge The badge object from DB to award
     */
    awardBadge(tx, userId, badge) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if user already has the badge
            const existingUserBadge = yield tx.userBadge.findUnique({
                where: { userId_badgeId: { userId, badgeId: badge.id } },
            });
            if (existingUserBadge) {
                console.log(`User ${userId} already has badge ${badge.name}`);
                return null; // Already awarded
            }
            // Award the badge
            console.log(`Awarding badge ${badge.name} to user ${userId}`);
            const newUserBadge = yield tx.userBadge.create({
                data: {
                    userId,
                    badgeId: badge.id,
                },
            });
            return newUserBadge;
        });
    }
    /**
     * Checks if any badges should be awarded based on the user\'s new state (points, event counts).
     * Runs within a transaction.
     * @param tx Prisma Transaction Client
     * @param userId ID of the user
     * @param updatedUser The user object after points update (optional, pass if available)
     * @param triggeredEventType The event type that just occurred (optional)
     */
    checkAndAwardBadges(tx, userId, updatedUser, triggeredEventType) {
        return __awaiter(this, void 0, void 0, function* () {
            // Fetch user data if not provided
            const user = updatedUser !== null && updatedUser !== void 0 ? updatedUser : yield tx.user.findUnique({ where: { id: userId } });
            if (!user)
                return; // User not found
            const userPoints = user.points;
            // Fetch all badge definitions (in real app, cache this or fetch efficiently)
            const allBadges = yield tx.badge.findMany();
            // Fetch badges the user already has
            const userBadgeIds = (yield tx.userBadge.findMany({ where: { userId }, select: { badgeId: true } })).map(ub => ub.badgeId);
            for (const badge of allBadges) {
                if (userBadgeIds.includes(badge.id)) {
                    continue; // Skip already awarded badges
                }
                let shouldAward = false;
                // Check point threshold
                if (badge.pointsThreshold !== null && userPoints >= badge.pointsThreshold) {
                    shouldAward = true;
                }
                // Check specific event trigger
                if (!shouldAward && badge.eventTrigger && badge.eventTrigger === triggeredEventType) {
                    // Check if it\'s the first occurrence for specific badges by name
                    if (badge.name === "Primeiro Agendamento" || badge.name === "Avaliador Iniciante") {
                        const eventCount = yield tx.gamificationEvent.count({
                            where: { userId: userId, eventType: badge.eventTrigger },
                        });
                        // The event was just recorded, so count should be exactly 1 if it\'s the first time
                        if (eventCount === 1) {
                            shouldAward = true;
                        }
                    }
                    else if (badge.name === "Bem-Vindo(a)!") {
                        // Registration event only happens once, so trigger is enough
                        shouldAward = true;
                    }
                    // Add checks for other single-event badges here
                }
                // Check for count-based badges (like "Cliente Frequente")
                if (!shouldAward && badge.name === "Cliente Frequente" && triggeredEventType === GamificationEventType.APPOINTMENT_COMPLETED) {
                    const requiredCount = 5; // Define count needed for this badge
                    const eventCount = yield tx.gamificationEvent.count({
                        where: { userId: userId, eventType: GamificationEventType.APPOINTMENT_COMPLETED },
                    });
                    if (eventCount >= requiredCount) {
                        shouldAward = true;
                    }
                }
                // Add checks for other count-based badges here
                if (shouldAward) {
                    yield this.awardBadge(tx, userId, badge);
                    // Update userBadgeIds locally to prevent re-awarding in the same loop if multiple badges are triggered
                    userBadgeIds.push(badge.id);
                }
            }
        });
    }
    /**
     * Triggers a gamification event, adds points, and checks for badge awards.
     * This is the main public method to be called by other services/controllers.
     * @param userId ID of the user performing the action
     * @param eventType Type of the event that occurred
     * @param context Optional context data (no longer used for relatedEntityId/Type)
     */
    triggerEvent(userId, eventType, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const pointsToAdd = (_a = EVENT_POINTS[eventType]) !== null && _a !== void 0 ? _a : 0;
            try {
                yield prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    let updatedUser = null;
                    // Ensure user exists before adding points
                    const userExists = yield tx.user.findUnique({ where: { id: userId } });
                    if (!userExists) {
                        console.error(`User ${userId} not found. Cannot trigger gamification event.`);
                        return; // Exit transaction if user doesn\'t exist
                    }
                    if (pointsToAdd > 0) {
                        updatedUser = yield this.addPoints(tx, userId, pointsToAdd, eventType);
                    }
                    // Check for badges after points are added and event is recorded
                    yield this.checkAndAwardBadges(tx, userId, updatedUser !== null && updatedUser !== void 0 ? updatedUser : undefined, eventType);
                }));
            }
            catch (error) {
                console.error(`Error processing gamification event ${eventType} for user ${userId}:`, error);
                // Decide if the error should propagate or just be logged
                // throw error; // Uncomment to propagate
            }
        });
    }
    /**
    * Seeds the database with predefined badges.
    * Should be run cautiously, ideally during deployment or setup.
    */
    seedBadges() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Seeding badges...");
            let count = 0;
            for (const badgeDef of BADGE_DEFINITIONS) {
                try {
                    yield prisma_1.prisma.badge.upsert({
                        where: { name: badgeDef.name }, // Use name as unique identifier
                        update: {
                            description: badgeDef.description,
                            iconUrl: badgeDef.iconUrl,
                            pointsThreshold: badgeDef.pointsThreshold,
                            eventTrigger: badgeDef.eventTrigger,
                        },
                        create: {
                            name: badgeDef.name,
                            description: badgeDef.description,
                            iconUrl: badgeDef.iconUrl,
                            pointsThreshold: badgeDef.pointsThreshold,
                            eventTrigger: badgeDef.eventTrigger,
                        },
                    });
                    count++;
                }
                catch (error) {
                    console.error(`Error seeding badge "${badgeDef.name}":`, error);
                }
            }
            console.log(`Seeded/Updated ${count} badges.`);
        });
    }
}
// Export a singleton instance
exports.gamificationService = new GamificationService();
