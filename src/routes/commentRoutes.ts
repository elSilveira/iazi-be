import { Router } from 'express';
import { body, param } from 'express-validator';
import { handleValidationErrors } from '../middlewares/validationMiddleware'; // Assuming this middleware exists
import { protect } from '../middlewares/authMiddleware'; // Assuming this middleware exists
// import * as commentController from '../controllers/commentController'; // Placeholder import

const router = Router({ mergeParams: true }); // mergeParams allows access to :postId from parent router

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comment management on posts
 */

// Placeholder functions - replace with actual controller imports later
const createComment = (req, res) => res.status(501).json({ message: 'Not Implemented' });
const getComments = (req, res) => res.status(501).json({ message: 'Not Implemented' });
const updateComment = (req, res) => res.status(501).json({ message: 'Not Implemented' });
const deleteComment = (req, res) => res.status(501).json({ message: 'Not Implemented' });

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
    '/',
    protect, // Requires authentication
    [
        param('postId').isUUID().withMessage('Invalid Post ID'),
        body('content').notEmpty().withMessage('Content is required'),
    ],
    handleValidationErrors,
    createComment // Replace with commentController.createComment
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
    '/',
    [param('postId').isUUID().withMessage('Invalid Post ID')],
    handleValidationErrors,
    getComments // Replace with commentController.getComments
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
    '/:commentId', // Note: This route might need adjustment depending on how it's mounted in app.ts
    protect, // Requires authentication
    [
        param('commentId').isUUID().withMessage('Invalid Comment ID'),
        body('content').notEmpty().withMessage('Content is required'),
    ],
    handleValidationErrors,
    updateComment // Replace with commentController.updateComment
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
    '/:commentId', // Note: This route might need adjustment depending on how it's mounted in app.ts
    protect, // Requires authentication
    [param('commentId').isUUID().withMessage('Invalid Comment ID')],
    handleValidationErrors,
    deleteComment // Replace with commentController.deleteComment
);

export default router;

