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
exports.unlikeComment = exports.likeComment = exports.unlikePost = exports.likePost = void 0;
const errors_1 = require("../lib/errors"); // Assuming custom error classes exist in lib/errors
// Ensure all async handlers return Promise<void> or call next()
const likePost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        next(new Error('Authentication required but user ID not found in request'));
        return;
    }
    const { postId } = req.params; // postId from the route /api/posts/:postId/like
    try {
        // TODO: Replace placeholder call with actual service call
        // const newLike = await likeService.likePost(userId, postId);
        const newLike = { id: 'mock-like-id', userId, postId, commentId: null, createdAt: new Date() }; // Placeholder response with type
        // Use 201 if creating, 200 if just confirming (service logic decides)
        res.status(201).json(newLike);
    }
    catch (error) {
        // Handle potential errors like 'already liked' (e.g., Prisma unique constraint)
        // The service should ideally throw specific errors (e.g., ConflictError)
        next(error);
    }
});
exports.likePost = likePost;
const unlikePost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        next(new Error('Authentication required but user ID not found in request'));
        return;
    }
    const { postId } = req.params;
    try {
        // TODO: Replace placeholder call with actual service call
        // await likeService.unlikePost(userId, postId);
        const success = true; // Placeholder response
        if (!success) {
            // Service should throw NotFoundError if the like didn't exist
            next(new errors_1.NotFoundError('Like not found (placeholder)'));
            return;
        }
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
exports.unlikePost = unlikePost;
const likeComment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        next(new Error('Authentication required but user ID not found in request'));
        return;
    }
    const { commentId } = req.params; // commentId from the route /api/comments/:commentId/like
    try {
        // TODO: Replace placeholder call with actual service call
        // const newLike = await likeService.likeComment(userId, commentId);
        const newLike = { id: 'mock-like-id', userId, postId: null, commentId, createdAt: new Date() }; // Placeholder response with type
        res.status(201).json(newLike);
    }
    catch (error) {
        next(error);
    }
});
exports.likeComment = likeComment;
const unlikeComment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        next(new Error('Authentication required but user ID not found in request'));
        return;
    }
    const { commentId } = req.params;
    try {
        // TODO: Replace placeholder call with actual service call
        // await likeService.unlikeComment(userId, commentId);
        const success = true; // Placeholder response
        if (!success) {
            // Service should throw NotFoundError
            next(new errors_1.NotFoundError('Like not found (placeholder)'));
            return;
        }
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
exports.unlikeComment = unlikeComment;
