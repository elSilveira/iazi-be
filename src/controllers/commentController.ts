import { Request, Response } from 'express';

// Placeholder: Implement actual logic using services and Prisma

export const createComment = async (req: Request, res: Response) => {
    // const userId = req.user.id; // Assuming user ID is available from auth middleware
    // const { postId } = req.params;
    // const { content } = req.body;
    // TODO: Call CommentService.createComment(userId, postId, content)
    res.status(501).json({ message: 'Not Implemented' });
};

export const getComments = async (req: Request, res: Response) => {
    // const { postId } = req.params;
    // const { page = 1, limit = 10 } = req.query;
    // TODO: Call CommentService.getCommentsByPost(postId, Number(page), Number(limit))
    res.status(501).json({ message: 'Not Implemented' });
};

export const updateComment = async (req: Request, res: Response) => {
    // const userId = req.user.id;
    // const { commentId } = req.params;
    // const { content } = req.body;
    // TODO: Call CommentService.updateComment(userId, commentId, content)
    res.status(501).json({ message: 'Not Implemented' });
};

export const deleteComment = async (req: Request, res: Response) => {
    // const userId = req.user.id;
    // const userRole = req.user.role; // Assuming role is available
    // const { commentId } = req.params;
    // TODO: Call CommentService.deleteComment(userId, userRole, commentId)
    res.status(501).json({ message: 'Not Implemented' });
};

