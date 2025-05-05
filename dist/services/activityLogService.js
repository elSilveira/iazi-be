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
exports.getUserActivityFeed = exports.logActivity = void 0;
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
/**
 * Logs an activity for a specific user.
 *
 * @param userId - The ID of the user performing the action.
 * @param type - The type of activity (e.g., 'NEW_APPOINTMENT', 'NEW_REVIEW').
 * @param relatedEntity - Optional entity related to the activity (e.g., the appointment or review object).
 * @param message - A descriptive message for the activity log.
 */
const logActivity = (userId, type, message, relatedEntity) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prismaClient_1.default.activityLog.create({
            data: {
                userId,
                type,
                message,
                relatedEntityId: relatedEntity === null || relatedEntity === void 0 ? void 0 : relatedEntity.id,
                relatedEntityType: relatedEntity === null || relatedEntity === void 0 ? void 0 : relatedEntity.type,
            },
        });
        console.log(`Activity logged: User ${userId}, Type: ${type}, Message: ${message}`);
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
        const activities = yield prismaClient_1.default.activityLog.findMany({
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
        const totalActivities = yield prismaClient_1.default.activityLog.count({
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
