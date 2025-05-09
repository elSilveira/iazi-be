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
exports.getUserActivityFeed = exports.logActivity = void 0;
const prisma_1 = require("../lib/prisma");
/**
 * Logs an activity for a specific user.
 *
 * @param userId - The ID of the user performing the action.
 * @param activityType - The type of activity (e.g., 'NEW_APPOINTMENT', 'NEW_REVIEW').
 * @param relatedEntity - Optional entity related to the activity (e.g., the appointment or review object).
 * @param message - A descriptive message for the activity log.
 */
const logActivity = (userId, activityType, // renamed from 'type'
message, relatedEntity) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.prisma.activityLog.create({
            data: {
                userId,
                activityType, // use correct field name
                referenceId: relatedEntity === null || relatedEntity === void 0 ? void 0 : relatedEntity.id, // use correct field name
                details: { message, relatedEntityType: relatedEntity === null || relatedEntity === void 0 ? void 0 : relatedEntity.type }, // store message and type in details JSON
            },
        });
        console.log(`Activity logged: User ${userId}, Type: ${activityType}, Message: ${message}`);
    }
    catch (error) {
        console.error('Error logging activity:', error);
        // Decide if the error should be thrown or handled silently
        // Depending on the application's needs, you might not want
        // a logging failure to interrupt the main flow.
        // throw new Error('Failed to log activity');
    }
});
exports.logActivity = logActivity;
/**
 * Retrieves the activity feed for a given user.
 *
 * @param userId - The ID of the user whose feed is being requested.
 * @param page - The page number for pagination (default: 1).
 * @param pageSize - The number of items per page (default: 10).
 * @returns A list of activity logs for the user.
 */
const getUserActivityFeed = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const take = pageSize;
    try {
        const activities = yield prisma_1.prisma.activityLog.findMany({
            where: {
                // Initially, just fetch the user's own activities.
                // TODO: Expand logic to include activities from followed entities if/when a follow system exists.
                userId: userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip,
            take,
        });
        const totalActivities = yield prisma_1.prisma.activityLog.count({
            where: {
                userId: userId,
            },
        });
        return {
            data: activities,
            pagination: {
                page,
                pageSize,
                totalItems: totalActivities,
                totalPages: Math.ceil(totalActivities / pageSize),
            }
        };
    }
    catch (error) {
        console.error('Error fetching user activity feed:', error);
        throw new Error('Failed to fetch activity feed');
    }
});
exports.getUserActivityFeed = getUserActivityFeed;
