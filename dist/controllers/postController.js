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
exports.deletePost = exports.updatePost = exports.getPostById = exports.getUserPosts = exports.getPosts = exports.createPost = void 0;
const postService = __importStar(require("../services/postService"));
const errors_1 = require("../lib/errors");
// Helper to parse pagination query parameters
const getPaginationParams = (req) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    // Add validation if needed (e.g., page > 0, limit > 0)
    return { page, limit };
};
const createPost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const authorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!authorId) {
        // This should ideally be caught by the 'protect' middleware, but double-check
        return next(new Error('Authentication required but user ID not found in request'));
    }
    const { content, imageUrl } = req.body;
    const postData = { content, imageUrl };
    try {
        const newPost = yield postService.createPost(authorId, postData);
        res.status(201).json(newPost);
    }
    catch (error) {
        next(error); // Pass errors (like NotFoundError from service) to the global error handler
    }
});
exports.createPost = createPost;
const getPosts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page, limit } = getPaginationParams(req);
        const posts = yield postService.getFeedPosts(page, limit);
        res.status(200).json(posts);
    }
    catch (error) {
        next(error);
    }
});
exports.getPosts = getPosts;
const getUserPosts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const { page, limit } = getPaginationParams(req);
        const posts = yield postService.getUserPosts(userId, page, limit);
        // Service throws NotFoundError if user doesn't exist
        res.status(200).json(posts);
    }
    catch (error) {
        next(error);
    }
});
exports.getUserPosts = getUserPosts;
const getPostById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.params;
        const post = yield postService.getPostById(postId);
        // Service throws NotFoundError if post doesn't exist
        res.status(200).json(post);
    }
    catch (error) {
        next(error);
    }
});
exports.getPostById = getPostById;
const updatePost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const authorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!authorId) {
        return next(new Error('Authentication required but user ID not found in request'));
    }
    const { postId } = req.params;
    const { content, imageUrl } = req.body;
    // Basic check: ensure at least one field is provided for update
    if (content === undefined && imageUrl === undefined) {
        return next(new errors_1.BadRequestError('No update data provided (content or imageUrl required).'));
    }
    // Construct update data, filtering out undefined fields
    const updateData = {};
    if (content !== undefined)
        updateData.content = content;
    if (imageUrl !== undefined)
        updateData.imageUrl = imageUrl;
    try {
        const updatedPost = yield postService.updatePost(authorId, postId, updateData);
        // Service throws NotFoundError or ForbiddenError
        res.status(200).json(updatedPost);
    }
    catch (error) {
        next(error);
    }
});
exports.updatePost = updatePost;
const deletePost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const authorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role; // Assuming role is available on req.user
    if (!authorId || !userRole) {
        return next(new Error('Authentication required but user ID or role not found in request'));
    }
    const { postId } = req.params;
    try {
        yield postService.deletePost(authorId, userRole, postId);
        // Service throws NotFoundError or ForbiddenError
        res.status(204).send(); // No content on successful deletion
    }
    catch (error) {
        next(error);
    }
});
exports.deletePost = deletePost;
