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
exports.deletePost = exports.updatePost = exports.getPostById = exports.getUserPosts = exports.getPosts = exports.createPost = void 0;
const errors_1 = require("../lib/errors"); // Assuming custom error classes exist in lib/errors
// Ensure all async handlers return Promise<void> or call next()
const createPost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const authorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!authorId) {
        // Use next() for errors
        next(new Error('Authentication required but user ID not found in request'));
        return; // Explicit return after next()
    }
    const { content, imageUrl } = req.body;
    try {
        const postData = { content, imageUrl };
        // TODO: Replace placeholder call with actual service call
        // const newPost = await postService.createPost(authorId, postData);
        const newPost = { id: 'mock-post-id', authorId, content, imageUrl: imageUrl || null, createdAt: new Date(), updatedAt: new Date() }; // Placeholder response with type
        res.status(201).json(newPost);
    }
    catch (error) {
        next(error); // Pass errors to the global error handler
    }
});
exports.createPost = createPost;
const getPosts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '10', 10);
        // TODO: Replace placeholder call with actual service call
        // const posts = await postService.getFeedPosts(page, limit);
        const posts = []; // Placeholder response with explicit type
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
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '10', 10);
        // TODO: Replace placeholder call with actual service call
        // const posts = await postService.getUserPosts(userId, page, limit);
        const posts = []; // Placeholder response with explicit type
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
        // TODO: Replace placeholder call with actual service call
        // const post = await postService.getPostById(postId);
        const post = { id: postId, content: 'Mock Content', authorId: 'mock-user-id', imageUrl: null, createdAt: new Date(), updatedAt: new Date() }; // Placeholder response with type
        if (!post) {
            // Service should throw NotFoundError
            next(new errors_1.NotFoundError('Post not found (placeholder)'));
            return;
        }
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
        next(new Error('Authentication required but user ID not found in request'));
        return;
    }
    const { postId } = req.params;
    const { content, imageUrl } = req.body;
    if (content === undefined && imageUrl === undefined) {
        next(new errors_1.BadRequestError('No update data provided.'));
        return;
    }
    try {
        const updateData = { content, imageUrl };
        // TODO: Replace placeholder call with actual service call
        // const updatedPost = await postService.updatePost(authorId, postId, updateData);
        const updatedPost = { id: postId, authorId, content, imageUrl, updatedAt: new Date() }; // Placeholder response with type
        if (!updatedPost) {
            // Service should throw NotFoundError or ForbiddenError
            next(new errors_1.NotFoundError('Post not found or update forbidden (placeholder)'));
            return;
        }
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
    if (!authorId) {
        next(new Error('Authentication required but user ID not found in request'));
        return;
    }
    const { postId } = req.params;
    try {
        // TODO: Replace placeholder call with actual service call
        // await postService.deletePost(authorId, userRole || 'USER', postId); // Provide a default role if needed
        const success = true; // Placeholder response
        if (!success) {
            // Service should throw NotFoundError or ForbiddenError
            next(new errors_1.NotFoundError('Post not found or deletion forbidden (placeholder)'));
            return;
        }
        res.status(204).send(); // No content on successful deletion
    }
    catch (error) {
        next(error);
    }
});
exports.deletePost = deletePost;
