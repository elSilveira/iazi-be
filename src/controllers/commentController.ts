import { Request, Response, NextFunction } from 'express';
import * as commentService from '../services/commentService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { BadRequestError } from '../lib/errors';
import { Comment } from '@prisma/client'; // Import if needed for response typing

// Helper to parse pagination query parameters
const getPaginationParams = (req: Request): { page: number, limit: number } => {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    // Add validation if needed (e.g., page > 0, limit > 0)
    return { page, limit };
};

export const createComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authorId = req.user?.userId;
    if (!authorId) {
        return next(new Error('Authentication required but user ID not found in request'));
    }

    const { postId } = req.params; // postId from the route /api/posts/:postId/comments
    const { content } = req.body;

    if (!content) {
        return next(new BadRequestError('Comment content is required.'));
    }

    try {
        const newComment = await commentService.createComment(authorId, postId, content);
        // Service throws NotFoundError if user or post doesn't exist
        res.status(201).json(newComment);
    } catch (error) {
        next(error);
    }
};

export const getComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { postId } = req.params;
        const { page, limit } = getPaginationParams(req);
        const comments = await commentService.getCommentsByPost(postId, page, limit);
        // Service throws NotFoundError if post doesn't exist
        res.status(200).json(comments);
    } catch (error) {
        next(error);
    }
};

export const updateComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authorId = req.user?.userId;
    if (!authorId) {
        return next(new Error('Authentication required but user ID not found in request'));
    }

    const { commentId } = req.params; // commentId from the route /api/comments/:commentId
    const { content } = req.body;

    if (!content) {
        return next(new BadRequestError('Content is required for update.'));
    }

    try {
        const updatedComment = await commentService.updateComment(authorId, commentId, content);
        // Service throws NotFoundError or ForbiddenError
        res.status(200).json(updatedComment);
    } catch (error) {
        next(error);
    }
};

export const deleteComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authorId = req.user?.userId;
    const userRole = req.user?.role;

    if (!authorId || !userRole) {
        return next(new Error('Authentication required but user ID or role not found in request'));
    }

    const { commentId } = req.params;

    try {
        await commentService.deleteComment(authorId, userRole, commentId);
        // Service throws NotFoundError or ForbiddenError
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

