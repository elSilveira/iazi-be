"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const commentService = __importStar(require("../services/commentService"));
const errors_1 = require("../lib/errors");
// Helper to parse pagination query parameters
const getPaginationParams = (req) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    // Add validation if needed (e.g., page > 0, limit > 0)
    return { page, limit };
};
const createComment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const authorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!authorId) {
        return next(new Error('Authentication required but user ID not found in request'));
    }
    const { postId } = req.params; // postId from the route /api/posts/:postId/comments
    const { content } = req.body;
    if (!content) {
        return next(new errors_1.BadRequestError('Comment content is required.'));
    }
    try {
        const newComment = yield commentService.createComment(authorId, postId, content);
        // Service throws NotFoundError if user or post doesn't exist
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
        const { page, limit } = getPaginationParams(req);
        const comments = yield commentService.getCommentsByPost(postId, page, limit);
        // Service throws NotFoundError if post doesn't exist
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
        return next(new Error('Authentication required but user ID not found in request'));
    }
    const { commentId } = req.params; // commentId from the route /api/comments/:commentId
    const { content } = req.body;
    if (!content) {
        return next(new errors_1.BadRequestError('Content is required for update.'));
    }
    try {
        const updatedComment = yield commentService.updateComment(authorId, commentId, content);
        // Service throws NotFoundError or ForbiddenError
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
    if (!authorId || !userRole) {
        return next(new Error('Authentication required but user ID or role not found in request'));
    }
    const { commentId } = req.params;
    try {
        yield commentService.deleteComment(authorId, userRole, commentId);
        // Service throws NotFoundError or ForbiddenError
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
exports.deleteComment = deleteComment;
