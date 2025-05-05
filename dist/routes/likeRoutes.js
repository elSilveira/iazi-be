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
const validationMiddleware_1 = require("../middlewares/validationMiddleware"); // Assuming this middleware exists
const authMiddleware_1 = require("../middlewares/authMiddleware"); // Assuming this middleware exists
const likeController = __importStar(require("../controllers/likeController")); // Import actual controller
const router = (0, express_1.Router)(); // Not using mergeParams as paths are fully defined here
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
router.post('/posts/:postId/like', // Define specific path
authMiddleware_1.protect, [(0, express_validator_1.param)('postId').isUUID().withMessage('Invalid Post ID')], validationMiddleware_1.handleValidationErrors, likeController.likePost // Use actual controller function
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
router.delete('/posts/:postId/like', // Define specific path
authMiddleware_1.protect, [(0, express_validator_1.param)('postId').isUUID().withMessage('Invalid Post ID')], validationMiddleware_1.handleValidationErrors, likeController.unlikePost // Use actual controller function
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
router.post('/comments/:commentId/like', // Define specific path
authMiddleware_1.protect, [(0, express_validator_1.param)('commentId').isUUID().withMessage('Invalid Comment ID')], validationMiddleware_1.handleValidationErrors, likeController.likeComment // Use actual controller function
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
router.delete('/comments/:commentId/like', // Define specific path
authMiddleware_1.protect, [(0, express_validator_1.param)('commentId').isUUID().withMessage('Invalid Comment ID')], validationMiddleware_1.handleValidationErrors, likeController.unlikeComment // Use actual controller function
);
exports.default = router;
