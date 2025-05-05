import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import * as postService from '../services/postService'; // Assuming named exports
import { AuthenticatedRequest } from '../middlewares/authMiddleware'; // Assuming this type exists for req.user
import { BadRequestError, NotFoundError } from '../lib/errors'; // Assuming custom error classes exist in lib/errors
import { Post } from '@prisma/client'; // Import Post type for explicit typing

// Ensure all async handlers return Promise<void> or call next()

export const createPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authorId = req.user?.userId;

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
    const newPost: Post = { id: 'mock-post-id', authorId, content, imageUrl: imageUrl || null, createdAt: new Date(), updatedAt: new Date() }; // Placeholder response with type
    res.status(201).json(newPost);
  } catch (error) {
    next(error); // Pass errors to the global error handler
  }
};

export const getPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    // TODO: Replace placeholder call with actual service call
    // const posts = await postService.getFeedPosts(page, limit);
    const posts: Post[] = []; // Placeholder response with explicit type
    res.status(200).json(posts);
  } catch (error) {
    next(error);
  }
};

export const getUserPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    // TODO: Replace placeholder call with actual service call
    // const posts = await postService.getUserPosts(userId, page, limit);
    const posts: Post[] = []; // Placeholder response with explicit type
    res.status(200).json(posts);
  } catch (error) {
    next(error);
  }
};

export const getPostById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { postId } = req.params;
    // TODO: Replace placeholder call with actual service call
    // const post = await postService.getPostById(postId);
    const post: Post | null = { id: postId, content: 'Mock Content', authorId: 'mock-user-id', imageUrl: null, createdAt: new Date(), updatedAt: new Date() }; // Placeholder response with type
    if (!post) {
        // Service should throw NotFoundError
        next(new NotFoundError('Post not found (placeholder)'));
        return;
    }
    res.status(200).json(post);
  } catch (error) {
    next(error);
  }
};

export const updatePost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authorId = req.user?.userId;
  if (!authorId) {
    next(new Error('Authentication required but user ID not found in request'));
    return;
  }

  const { postId } = req.params;
  const { content, imageUrl } = req.body;

  if (content === undefined && imageUrl === undefined) {
      next(new BadRequestError('No update data provided.'));
      return;
  }

  try {
    const updateData = { content, imageUrl };
    // TODO: Replace placeholder call with actual service call
    // const updatedPost = await postService.updatePost(authorId, postId, updateData);
    const updatedPost: Partial<Post> = { id: postId, authorId, content, imageUrl, updatedAt: new Date() }; // Placeholder response with type
     if (!updatedPost) {
        // Service should throw NotFoundError or ForbiddenError
        next(new NotFoundError('Post not found or update forbidden (placeholder)'));
        return;
    }
    res.status(200).json(updatedPost);
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authorId = req.user?.userId;
  const userRole = req.user?.role; // Assuming role is available on req.user

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
        next(new NotFoundError('Post not found or deletion forbidden (placeholder)'));
        return;
    }
    res.status(204).send(); // No content on successful deletion
  } catch (error) {
    next(error);
  }
};

