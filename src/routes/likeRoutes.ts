import { Router } from 'express';
import { param } from 'express-validator';
import { handleValidationErrors } from '../middlewares/validationMiddleware'; // Assuming this middleware exists
import { protect } from '../middlewares/authMiddleware'; // Assuming this middleware exists
// import * as likeController from '../controllers/likeController'; // Placeholder import

const router = Router({ mergeParams: true }); // mergeParams might be needed if mounted under posts or comments

/**
 * @swagger
 * tags:
 *   name: Likes
 *   description: Liking and unliking posts and comments
 */

// Placeholder functions - replace with actual controller imports later
const likePost = (req, res) => res.status(501).json({ message: 'Not Implemented' });
const unlikePost = (req, res) => res.status(501).json({ message: 'Not Implemented' });
const likeComment = (req, res) => res.status(501).json({ message: 'Not Implemented' });
const unlikeComment = (req, res) => res.status(501).json({ message: 'Not Implemented' });

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
    protect,
    [param('postId').isUUID().withMessage('Invalid Post ID')],
    handleValidationErrors,
    likePost // Replace with likeController.likePost
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
    protect,
    [param('postId').isUUID().withMessage('Invalid Post ID')],
    handleValidationErrors,
    unlikePost // Replace with likeController.unlikePost
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
    protect,
    [param('commentId').isUUID().withMessage('Invalid Comment ID')],
    handleValidationErrors,
    likeComment // Replace with likeController.likeComment
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
    protect,
    [param('commentId').isUUID().withMessage('Invalid Comment ID')],
    handleValidationErrors,
    unlikeComment // Replace with likeController.unlikeComment
);

export default router;

