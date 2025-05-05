import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import * as commentService from '../services/commentService'; // Assuming named exports
import { AuthenticatedRequest } from '../middlewares/authMiddleware'; // Assuming this type exists for req.user
import { BadRequestError, NotFoundError } from '../lib/errors'; // Assuming custom error classes exist in lib/errors
import { Comment } from '@prisma/client'; // Import Comment type for explicit typing

// Ensure all async handlers return Promise<void> or call next()

export const createComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authorId = req.user?.userId;
  if (!authorId) {
    next(new Error('Authentication required but user ID not found in request'));
    return;
  }

  const { postId } = req.params; // postId from the route /api/posts/:postId/comments
  const { content } = req.body;

  try {
    // TODO: Replace placeholder call with actual service call
    // const newComment = await commentService.createComment(authorId, postId, content);
    const newComment: Comment = { id: 'mock-comment-id', authorId, postId, content, createdAt: new Date(), updatedAt: new Date(), parentId: null }; // Placeholder response with type
    res.status(201).json(newComment);
  } catch (error) {
    next(error);
  }
};

export const getComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    // TODO: Replace placeholder call with actual service call
    // const comments = await commentService.getCommentsByPost(postId, page, limit);
    const comments: Comment[] = []; // Placeholder response with explicit type
    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authorId = req.user?.userId;
  if (!authorId) {
    next(new Error('Authentication required but user ID not found in request'));
    return;
  }

  const { commentId } = req.params; // commentId from the route /api/comments/:commentId
  const { content } = req.body;

  if (content === undefined) {
      next(new BadRequestError('Content is required for update.'));
      return;
  }

  try {
    // TODO: Replace placeholder call with actual service call
    // const updatedComment = await commentService.updateComment(authorId, commentId, content);
    // Placeholder needs postId which might not be available here easily, adjust if needed
    const updatedComment: Partial<Comment> = { id: commentId, authorId, content, updatedAt: new Date() }; // Placeholder response with type
    if (!updatedComment) {
        // Service should throw NotFoundError or ForbiddenError
        next(new NotFoundError('Comment not found or update forbidden (placeholder)'));
        return;
    }
    res.status(200).json(updatedComment);
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authorId = req.user?.userId;
  const userRole = req.user?.role;
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
        next(new NotFoundError('Comment not found or deletion forbidden (placeholder)'));
        return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

