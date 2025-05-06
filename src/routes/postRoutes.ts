import { Router } from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middlewares/validationMiddleware'; // Corrected import
import { authMiddleware } from '../middlewares/authMiddleware'; // Corrected import
import * as postController from '../controllers/postController'; // Import actual controller

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post management
 */

// Removed placeholder functions

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
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
 *               imageUrl:
 *                 type: string
 *                 format: url
 *     responses:
 *       201: { description: 'Post created' }
 *       400: { description: 'Validation error' }
 *       401: { description: 'Unauthorized' }
 */
router.post(
    '/',
    authMiddleware, // Corrected: Requires authentication
    [
        body('content').notEmpty().withMessage('Content is required'),
        body('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL'),
    ],
    validateRequest, // Corrected
    postController.createPost // Use actual controller function
);

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: List posts (feed)
 *     tags: [Posts]
 *     parameters:
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
 *       200: { description: 'List of posts' }
 */
router.get('/', postController.getPosts); // Use actual controller function

/**
 * @swagger
 * /api/users/{userId}/posts:
 *   get:
 *     summary: List posts by a specific user
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the user
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
 *       200: { description: 'List of user posts' }
 *       404: { description: 'User not found' }
 */
router.get(
    '/users/:userId/posts',
    [param('userId').isUUID().withMessage('Invalid User ID')],
    validateRequest, // Corrected
    postController.getUserPosts // Use actual controller function
);

/**
 * @swagger
 * /api/posts/{postId}:
 *   get:
 *     summary: Get details of a specific post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the post
 *     responses:
 *       200: { description: 'Post details' }
 *       404: { description: 'Post not found' }
 */
router.get(
    '/:postId',
    [param('postId').isUUID().withMessage('Invalid Post ID')],
    validateRequest, // Corrected
    postController.getPostById // Use actual controller function
);

/**
 * @swagger
 * /api/posts/{postId}:
 *   put:
 *     summary: Update a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the post to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *                 format: url
 *     responses:
 *       200: { description: 'Post updated' }
 *       400: { description: 'Validation error' }
 *       401: { description: 'Unauthorized' }
 *       403: { description: 'Forbidden (not author)' }
 *       404: { description: 'Post not found' }
 */
router.put(
    '/:postId',
    authMiddleware, // Corrected: Requires authentication
    [
        param('postId').isUUID().withMessage('Invalid Post ID'),
        body('content').optional().notEmpty().withMessage('Content cannot be empty if provided'),
        body('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL'),
    ],
    validateRequest, // Corrected
    postController.updatePost // Use actual controller function
);

/**
 * @swagger
 * /api/posts/{postId}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the post to delete
 *     responses:
 *       204: { description: 'Post deleted' }
 *       401: { description: 'Unauthorized' }
 *       403: { description: 'Forbidden (not author or admin)' }
 *       404: { description: 'Post not found' }
 */
router.delete(
    '/:postId',
    authMiddleware, // Corrected: Requires authentication
    [param('postId').isUUID().withMessage('Invalid Post ID')],
    validateRequest, // Corrected
    postController.deletePost // Use actual controller function
);

export default router;

