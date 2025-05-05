import { Router } from 'express';
import { body, param } from 'express-validator';
import { handleValidationErrors } from '../middlewares/validationMiddleware'; // Assuming this middleware exists
import { protect } from '../middlewares/authMiddleware'; // Assuming this middleware exists
import * as commentController from '../controllers/commentController'; // Import actual controller

const router = Router({ mergeParams: true }); // mergeParams allows access to :postId from parent router

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comment management on posts
 */

// Removed placeholder functions

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   post:
 *     summary: Create a new comment on a post
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the post to comment on
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201: { description: 'Comment created' }
 *       400: { description: 'Validation error' }
 *       401: { description: 'Unauthorized' }
 *       404: { description: 'Post not found' }
 */
router.post(
    '/', // Path relative to where it's mounted (/api/posts/:postId/comments)
    protect, // Requires authentication
    [
        param('postId').isUUID().withMessage('Invalid Post ID'), // Validate postId from mergeParams
        body('content').notEmpty().withMessage('Content is required'),
    ],
    handleValidationErrors,
    commentController.createComment // Use actual controller function
);

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   get:
 *     summary: List comments for a specific post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the post
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200: { description: 'List of comments' }
 *       404: { description: 'Post not found' }
 */
router.get(
    '/', // Path relative to where it's mounted (/api/posts/:postId/comments)
    [param('postId').isUUID().withMessage('Invalid Post ID')], // Validate postId from mergeParams
    handleValidationErrors,
    commentController.getComments // Use actual controller function
);

/**
 * @swagger
 * /api/comments/{commentId}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the comment to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200: { description: 'Comment updated' }
 *       400: { description: 'Validation error' }
 *       401: { description: 'Unauthorized' }
 *       403: { description: 'Forbidden (not author)' }
 *       404: { description: 'Comment not found' }
 */
router.put(
    '/:commentId', // Mounted separately, e.g., app.use('/api/comments', commentRoutes)
    protect, // Requires authentication
    [
        param('commentId').isUUID().withMessage('Invalid Comment ID'),
        body('content').notEmpty().withMessage('Content is required'),
    ],
    handleValidationErrors,
    commentController.updateComment // Use actual controller function
);

/**
 * @swagger
 * /api/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the comment to delete
 *     responses:
 *       204: { description: 'Comment deleted' }
 *       401: { description: 'Unauthorized' }
 *       403: { description: 'Forbidden (not author or admin)' }
 *       404: { description: 'Comment not found' }
 */
router.delete(
    '/:commentId', // Mounted separately, e.g., app.use('/api/comments', commentRoutes)
    protect, // Requires authentication
    [param('commentId').isUUID().withMessage('Invalid Comment ID')],
    handleValidationErrors,
    commentController.deleteComment // Use actual controller function
);

export default router;

