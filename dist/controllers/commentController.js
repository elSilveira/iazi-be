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
exports.deleteComment = exports.updateComment = exports.getComments = exports.createComment = void 0;
const errors_1 = require("../lib/errors"); // Assuming custom error classes exist in lib/errors
// Ensure all async handlers return Promise<void> or call next()
const createComment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const authorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!authorId) {
        next(new Error('Authentication required but user ID not found in request'));
        return;
    }
    const { postId } = req.params; // postId from the route /api/posts/:postId/comments
    const { content } = req.body;
    try {
        // TODO: Replace placeholder call with actual service call
        // const newComment = await commentService.createComment(authorId, postId, content);
        const newComment = { id: 'mock-comment-id', authorId, postId, content, createdAt: new Date(), updatedAt: new Date(), parentId: null }; // Placeholder response with type
        res.status(201).json(newComment);
    }
    catch (error) {
        next(error);
    }
});
exports.createComment = createComment;
const getComments = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.params;
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '10', 10);
        // TODO: Replace placeholder call with actual service call
        // const comments = await commentService.getCommentsByPost(postId, page, limit);
        const comments = []; // Placeholder response with explicit type
        res.status(200).json(comments);
    }
    catch (error) {
        next(error);
    }
});
exports.getComments = getComments;
const updateComment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const authorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!authorId) {
        next(new Error('Authentication required but user ID not found in request'));
        return;
    }
    const { commentId } = req.params; // commentId from the route /api/comments/:commentId
    const { content } = req.body;
    if (content === undefined) {
        next(new errors_1.BadRequestError('Content is required for update.'));
        return;
    }
    try {
        // TODO: Replace placeholder call with actual service call
        // const updatedComment = await commentService.updateComment(authorId, commentId, content);
        // Placeholder needs postId which might not be available here easily, adjust if needed
        const updatedComment = { id: commentId, authorId, content, updatedAt: new Date() }; // Placeholder response with type
        if (!updatedComment) {
            // Service should throw NotFoundError or ForbiddenError
            next(new errors_1.NotFoundError('Comment not found or update forbidden (placeholder)'));
            return;
        }
        res.status(200).json(updatedComment);
    }
    catch (error) {
        next(error);
    }
});
exports.updateComment = updateComment;
const deleteComment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const authorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    if (!authorId) {
        next(new Error('Authentication required but user ID not found in request'));
        return;
    }
    const { commentId } = req.params;
    try {
        // TODO: Replace placeholder call with actual service call
        // await commentService.deleteComment(authorId, userRole || 'USER', commentId);
        const success = true; // Placeholder response
        if (!success) {
            // Service should throw NotFoundError or ForbiddenError
            next(new errors_1.NotFoundError('Comment not found or deletion forbidden (placeholder)'));
            return;
        }
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
exports.deleteComment = deleteComment;
