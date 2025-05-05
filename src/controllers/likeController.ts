import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import * as likeService from '../services/likeService'; // Assuming named exports
import { AuthenticatedRequest } from '../middlewares/authMiddleware'; // Assuming this type exists for req.user
import { BadRequestError } from '../lib/errors'; // Assuming custom error classes exist in lib/errors

export const likePost = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Validation handled by middleware in routes
  const userId = req.user?.userId;
  if (!userId) {
    return next(new Error('Authentication required but user ID not found in request'));
  }

  const { postId } = req.params; // postId from the route /api/posts/:postId/like

  try {
    // TODO: Replace placeholder call with actual service call
    // const newLike = await likeService.likePost(userId, postId);
    const newLike = { id: 'mock-like-id', userId, postId, createdAt: new Date() }; // Placeholder response
    // Use 201 if creating, 200 if just confirming (service logic decides)
    res.status(201).json(newLike);
  } catch (error) {
    // Handle potential errors like 'already liked' (e.g., Prisma unique constraint)
    // The service should ideally throw specific errors (e.g., ConflictError)
    next(error);
  }
};

export const unlikePost = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;
  if (!userId) {
    return next(new Error('Authentication required but user ID not found in request'));
  }

  const { postId } = req.params;

  try {
    // TODO: Replace placeholder call with actual service call
    // await likeService.unlikePost(userId, postId);
    const success = true; // Placeholder response
    if (!success) {
        // Service would throw NotFoundError if the like didn't exist
        return res.status(404).json({ message: 'Like not found (placeholder)' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const likeComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;
  if (!userId) {
    return next(new Error('Authentication required but user ID not found in request'));
  }

  const { commentId } = req.params; // commentId from the route /api/comments/:commentId/like

  try {
    // TODO: Replace placeholder call with actual service call
    // const newLike = await likeService.likeComment(userId, commentId);
    const newLike = { id: 'mock-like-id', userId, commentId, createdAt: new Date() }; // Placeholder response
    res.status(201).json(newLike);
  } catch (error) {
    next(error);
  }
};

export const unlikeComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;
  if (!userId) {
    return next(new Error('Authentication required but user ID not found in request'));
  }

  const { commentId } = req.params;

  try {
    // TODO: Replace placeholder call with actual service call
    // await likeService.unlikeComment(userId, commentId);
    const success = true; // Placeholder response
    if (!success) {
        // Service would throw NotFoundError
        return res.status(404).json({ message: 'Like not found (placeholder)' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

