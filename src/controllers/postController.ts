import { Request, Response, NextFunction } from 'express';
import * as postService from '../services/postService';
// Removed import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { BadRequestError } from '../lib/errors';
import { Post } from '@prisma/client'; // Import Post type if needed for response typing

// Helper to parse pagination query parameters
const getPaginationParams = (req: Request): { page: number, limit: number } => {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    // Add validation if needed (e.g., page > 0, limit > 0)
    return { page, limit };
};

export const createPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Changed AuthenticatedRequest to Request
    const authorId = req.user?.id; // Changed userId to id
    if (!authorId) {
        // This should ideally be caught by the 'protect' middleware, but double-check
        return next(new Error('Authentication required but user ID not found in request'));
    }

    const { content, imageUrl } = req.body;
    const postData = { content, imageUrl };

    try {
        const newPost = await postService.createPost(authorId, postData);
        res.status(201).json(newPost);
    } catch (error) {
        next(error); // Pass errors (like NotFoundError from service) to the global error handler
    }
};

export const getPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { page, limit } = getPaginationParams(req);
        const posts = await postService.getFeedPosts(page, limit);
        res.status(200).json(posts);
    } catch (error) {
        next(error);
    }
};

export const getUserPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { userId } = req.params;
        const { page, limit } = getPaginationParams(req);
        const posts = await postService.getUserPosts(userId, page, limit);
        // Service throws NotFoundError if user doesn't exist
        res.status(200).json(posts);
    } catch (error) {
        next(error);
    }
};

export const getPostById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { postId } = req.params;
        const post = await postService.getPostById(postId);
        // Service throws NotFoundError if post doesn't exist
        res.status(200).json(post);
    } catch (error) {
        next(error);
    }
};

export const updatePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Changed AuthenticatedRequest to Request
    const authorId = req.user?.id; // Changed userId to id
    if (!authorId) {
        return next(new Error('Authentication required but user ID not found in request'));
    }

    const { postId } = req.params;
    const { content, imageUrl } = req.body;

    // Basic check: ensure at least one field is provided for update
    if (content === undefined && imageUrl === undefined) {
        return next(new BadRequestError('No update data provided (content or imageUrl required).'));
    }

    // Construct update data, filtering out undefined fields
    const updateData: Partial<{ content: string; imageUrl?: string }> = {};
    if (content !== undefined) updateData.content = content;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    try {
        const updatedPost = await postService.updatePost(authorId, postId, updateData);
        // Service throws NotFoundError or ForbiddenError
        res.status(200).json(updatedPost);
    } catch (error) {
        next(error);
    }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Changed AuthenticatedRequest to Request
    const authorId = req.user?.id; // Changed userId to id
    const userRole = req.user?.role; // Assuming role is available on req.user

    if (!authorId || !userRole) {
        return next(new Error('Authentication required but user ID or role not found in request'));
    }

    const { postId } = req.params;

    try {
        await postService.deletePost(authorId, userRole, postId);
        // Service throws NotFoundError or ForbiddenError
        res.status(204).send(); // No content on successful deletion
    } catch (error) {
        next(error);
    }
};

