import { Request, Response, NextFunction } from 'express';
import * as likeService from '../services/likeService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { Like } from '@prisma/client'; // Import if needed for response typing

export const likePost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
        return next(new Error('Authentication required but user ID not found in request'));
    }

    const { postId } = req.params; // postId from the route /api/posts/:postId/like

    try {
        const newLike = await likeService.likePost(userId, postId);
        // Service throws NotFoundError or ConflictError
        res.status(201).json(newLike); // 201 Created
    } catch (error) {
        next(error);
    }
};

export const unlikePost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
        return next(new Error('Authentication required but user ID not found in request'));
    }

    const { postId } = req.params;

    try {
        await likeService.unlikePost(userId, postId);
        // Service throws NotFoundError if the like didn't exist
        res.status(204).send(); // 204 No Content on successful unlike
    } catch (error) {
        next(error);
    }
};

export const likeComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
        return next(new Error('Authentication required but user ID not found in request'));
    }

    const { commentId } = req.params; // commentId from the route /api/comments/:commentId/like

    try {
        const newLike = await likeService.likeComment(userId, commentId);
        // Service throws NotFoundError or ConflictError
        res.status(201).json(newLike);
    } catch (error) {
        next(error);
    }
};

export const unlikeComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
        return next(new Error('Authentication required but user ID not found in request'));
    }

    const { commentId } = req.params;

    try {
        await likeService.unlikeComment(userId, commentId);
        // Service throws NotFoundError if the like didn't exist
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

