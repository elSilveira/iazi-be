import { Router } from 'express';
import { param } from 'express-validator';
import { validateRequest } from '../middlewares/validationMiddleware'; // Corrected import
import { authMiddleware } from '../middlewares/authMiddleware'; // Corrected import
import * as likeController from '../controllers/likeController'; // Import actual controller

const router = Router(); // Not using mergeParams as paths are fully defined here

/**
 * @swagger
 * tags:
 *   name: Likes
 *   description: Liking and unliking posts and comments
 */

// Removed placeholder functions

/**
 * @swagger
 * /api/posts/{postId}/like:
 *   post:
 *     summary: Like a post
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the post to like
 *     responses:
 *       201: { description: 'Post liked successfully' }
 *       400: { description: 'Validation error or already liked' }
 *       401: { description: 'Unauthorized' }
 *       404: { description: 'Post not found' }
 */
router.post(
    '/posts/:postId/like', // Define specific path
    authMiddleware, // Corrected
    [param('postId').isUUID().withMessage('Invalid Post ID')],
    validateRequest, // Corrected
    likeController.likePost // Use actual controller function
);

/**
 * @swagger
 * /api/posts/{postId}/like:
 *   delete:
 *     summary: Unlike a post
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the post to unlike
 *     responses:
 *       204: { description: 'Post unliked successfully' }
 *       400: { description: 'Validation error or not liked' }
 *       401: { description: 'Unauthorized' }
 *       404: { description: 'Post not found' }
 */
router.delete(
    '/posts/:postId/like', // Define specific path
    authMiddleware, // Corrected
    [param('postId').isUUID().withMessage('Invalid Post ID')],
    validateRequest, // Corrected
    likeController.unlikePost // Use actual controller function
);

/**
 * @swagger
 * /api/comments/{commentId}/like:
 *   post:
 *     summary: Like a comment
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the comment to like
 *     responses:
 *       201: { description: 'Comment liked successfully' }
 *       400: { description: 'Validation error or already liked' }
 *       401: { description: 'Unauthorized' }
 *       404: { description: 'Comment not found' }
 */
router.post(
    '/comments/:commentId/like', // Define specific path
    authMiddleware, // Corrected
    [param('commentId').isUUID().withMessage('Invalid Comment ID')],
    validateRequest, // Corrected
    likeController.likeComment // Use actual controller function
);

/**
 * @swagger
 * /api/comments/{commentId}/like:
 *   delete:
 *     summary: Unlike a comment
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the comment to unlike
 *     responses:
 *       204: { description: 'Comment unliked successfully' }
 *       400: { description: 'Validation error or not liked' }
 *       401: { description: 'Unauthorized' }
 *       404: { description: 'Comment not found' }
 */
router.delete(
    '/comments/:commentId/like', // Define specific path
    authMiddleware, // Corrected
    [param('commentId').isUUID().withMessage('Invalid Comment ID')],
    validateRequest, // Corrected
    likeController.unlikeComment // Use actual controller function
);

export default router;

