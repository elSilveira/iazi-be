import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import * as commentService from '../services/commentService'; // Assuming named exports
import { AuthenticatedRequest } from '../middlewares/authMiddleware'; // Assuming this type exists for req.user
import { BadRequestError } from '../lib/errors'; // Assuming custom error classes exist in lib/errors

export const createComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Validation handled by middleware in routes
  const authorId = req.user?.userId;
  if (!authorId) {
    return next(new Error('Authentication required but user ID not found in request'));
  }

  const { postId } = req.params; // postId from the route /api/posts/:postId/comments
  const { content } = req.body;

  try {
    // TODO: Replace placeholder call with actual service call
    // const newComment = await commentService.createComment(authorId, postId, content);
    const newComment = { id: 'mock-comment-id', authorId, postId, content, createdAt: new Date(), updatedAt: new Date() }; // Placeholder response
    res.status(201).json(newComment);
  } catch (error) {
    next(error);
  }
};

export const getComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    // TODO: Replace placeholder call with actual service call
    // const comments = await commentService.getCommentsByPost(postId, page, limit);
    const comments = []; // Placeholder response
    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authorId = req.user?.userId;
  if (!authorId) {
    return next(new Error('Authentication required but user ID not found in request'));
  }

  const { commentId } = req.params; // commentId from the route /api/comments/:commentId
  const { content } = req.body;

  if (content === undefined) {
      return next(new BadRequestError('Content is required for update.'));
  }

  try {
    // TODO: Replace placeholder call with actual service call
    // const updatedComment = await commentService.updateComment(authorId, commentId, content);
    const updatedComment = { id: commentId, authorId, content, updatedAt: new Date() }; // Placeholder response
    if (!updatedComment) {
        // Service would throw NotFoundError or ForbiddenError
        return res.status(404).json({ message: 'Comment not found or update forbidden (placeholder)' });
    }
    res.status(200).json(updatedComment);
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authorId = req.user?.userId;
  const userRole = req.user?.role;
  if (!authorId) {
    return next(new Error('Authentication required but user ID not found in request'));
  }

  const { commentId } = req.params;

  try {
    // TODO: Replace placeholder call with actual service call
    // await commentService.deleteComment(authorId, userRole || 'USER', commentId);
    const success = true; // Placeholder response
    if (!success) {
        // Service would throw NotFoundError or ForbiddenError
        return res.status(404).json({ message: 'Comment not found or deletion forbidden (placeholder)' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

