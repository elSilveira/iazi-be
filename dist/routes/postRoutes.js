"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validationMiddleware_1 = require("../middlewares/validationMiddleware"); // Corrected import
const authMiddleware_1 = require("../middlewares/authMiddleware"); // Corrected import
const postController = __importStar(require("../controllers/postController")); // Import actual controller
const router = (0, express_1.Router)();
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
router.post('/', authMiddleware_1.authMiddleware, // Corrected: Requires authentication
[
    (0, express_validator_1.body)('content').notEmpty().withMessage('Content is required'),
    (0, express_validator_1.body)('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL'),
], validationMiddleware_1.validateRequest, // Corrected
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
router.get('/users/:userId/posts', [(0, express_validator_1.param)('userId').isUUID().withMessage('Invalid User ID')], validationMiddleware_1.validateRequest, // Corrected
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
router.get('/:postId', [(0, express_validator_1.param)('postId').isUUID().withMessage('Invalid Post ID')], validationMiddleware_1.validateRequest, // Corrected
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
router.put('/:postId', authMiddleware_1.authMiddleware, // Corrected: Requires authentication
[
    (0, express_validator_1.param)('postId').isUUID().withMessage('Invalid Post ID'),
    (0, express_validator_1.body)('content').optional().notEmpty().withMessage('Content cannot be empty if provided'),
    (0, express_validator_1.body)('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL'),
], validationMiddleware_1.validateRequest, // Corrected
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
router.delete('/:postId', authMiddleware_1.authMiddleware, // Corrected: Requires authentication
[(0, express_validator_1.param)('postId').isUUID().withMessage('Invalid Post ID')], validationMiddleware_1.validateRequest, // Corrected
postController.deletePost // Use actual controller function
);
exports.default = router;
