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
exports.markAllAsRead = exports.markAsRead = exports.getUserNotifications = void 0;
const notificationService_1 = require("../services/notificationService");
const validationUtils_1 = require("../utils/validationUtils"); // Assuming a validation utility file exists
// Get unread notifications for the authenticated user
const getUserNotifications = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { page = '1', pageSize = '10' } = req.query;
    if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado." });
        return;
    }
    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);
    if (isNaN(pageNum) || pageNum < 1 || isNaN(pageSizeNum) || pageSizeNum < 1) {
        res.status(400).json({ message: "Parâmetros de paginação inválidos (page e pageSize devem ser números positivos)." });
        return;
    }
    try {
        const notificationData = yield (0, notificationService_1.getUnreadNotifications)(userId, pageNum, pageSizeNum);
        res.json(notificationData);
    }
    catch (error) {
        console.error("Error fetching user notifications:", error);
        next(error); // Pass error to the central error handler
    }
});
exports.getUserNotifications = getUserNotifications;
// Mark a specific notification as read
const markAsRead = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { id: notificationId } = req.params;
    if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado." });
        return;
    }
    if (!(0, validationUtils_1.isValidUUID)(notificationId)) {
        res.status(400).json({ message: "Formato de ID da notificação inválido." });
        return;
    }
    try {
        const updatedNotification = yield (0, notificationService_1.markNotificationAsRead)(notificationId, userId);
        res.json(updatedNotification);
    }
    catch (error) {
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
});
exports.markAsRead = markAsRead;
// Mark all notifications for the user as read
const markAllAsRead = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado." });
        return;
    }
    try {
        const result = yield (0, notificationService_1.markAllNotificationsAsRead)(userId);
        res.json({ message: `${result.count} notificações marcadas como lidas.`, count: result.count });
    }
    catch (error) {
        console.error(`Error marking all notifications as read for user ${userId}:`, error);
        next(error); // Pass error to the central error handler
    }
});
exports.markAllAsRead = markAllAsRead;
