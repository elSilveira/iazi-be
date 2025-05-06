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
const commentController = __importStar(require("../controllers/commentController")); // Import actual controller
const router = (0, express_1.Router)({ mergeParams: true }); // mergeParams allows access to :postId from parent router
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
router.post('/', // Path relative to where it's mounted (/api/posts/:postId/comments)
authMiddleware_1.authMiddleware, // Corrected: Requires authentication
[
    (0, express_validator_1.param)('postId').isUUID().withMessage('Invalid Post ID'), // Validate postId from mergeParams
    (0, express_validator_1.body)('content').notEmpty().withMessage('Content is required'),
], validationMiddleware_1.validateRequest, // Corrected
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
router.get('/', // Path relative to where it's mounted (/api/posts/:postId/comments)
[(0, express_validator_1.param)('postId').isUUID().withMessage('Invalid Post ID')], // Validate postId from mergeParams
validationMiddleware_1.validateRequest, // Corrected
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
router.put('/:commentId', // Mounted separately, e.g., app.use('/api/comments', commentRoutes)
authMiddleware_1.authMiddleware, // Corrected: Requires authentication
[
    (0, express_validator_1.param)('commentId').isUUID().withMessage('Invalid Comment ID'),
    (0, express_validator_1.body)('content').notEmpty().withMessage('Content is required'),
], validationMiddleware_1.validateRequest, // Corrected
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
router.delete('/:commentId', // Mounted separately, e.g., app.use('/api/comments', commentRoutes)
authMiddleware_1.authMiddleware, // Corrected: Requires authentication
[(0, express_validator_1.param)('commentId').isUUID().withMessage('Invalid Comment ID')], validationMiddleware_1.validateRequest, // Corrected
commentController.deleteComment // Use actual controller function
);
exports.default = router;
