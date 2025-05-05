import { prisma } from "../lib/prisma";
import { Comment, Prisma, UserRole } from "@prisma/client";
import { NotFoundError, ForbiddenError } from "../lib/errors";

export const createComment = async (authorId: string, postId: string, content: string): Promise<Comment> => {
    // Verifica se o usuário e o post existem
    const userExists = await prisma.user.findUnique({ where: { id: authorId } });
    if (!userExists) {
        throw new NotFoundError(`User with ID ${authorId} not found`);
    }
    const postExists = await prisma.post.findUnique({ where: { id: postId } });
    if (!postExists) {
        throw new NotFoundError(`Post with ID ${postId} not found`);
    }

    const newComment = await prisma.comment.create({
        data: {
            content,
            authorId,
            postId,
        },
        include: { // Inclui o autor para retornar informações básicas
            author: { select: { id: true, name: true, avatar: true } }
        }
    });
    return newComment;
};

export const getCommentsByPost = async (postId: string, page: number, limit: number): Promise<Comment[]> => {
    const skip = (page - 1) * limit;

    // Verifica se o post existe
    const postExists = await prisma.post.findUnique({ where: { id: postId } });
    if (!postExists) {
        throw new NotFoundError(`Post with ID ${postId} not found`);
    }

    const comments = await prisma.comment.findMany({
        where: { postId },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' }, // Ou 'desc' dependendo da ordem desejada
        include: {
            author: { select: { id: true, name: true, avatar: true } },
            _count: { select: { likes: true } } // Conta likes do comentário
        }
    });
    return comments;
};

export const updateComment = async (userId: string, commentId: string, content: string): Promise<Comment> => {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
        throw new NotFoundError(`Comment with ID ${commentId} not found`);
    }

    if (comment.authorId !== userId) {
        throw new ForbiddenError("User is not authorized to update this comment");
    }

    const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: { content },
        include: { // Retorna o comentário atualizado com informações do autor
            author: { select: { id: true, name: true, avatar: true } },
             _count: { select: { likes: true } }
        }
    });
    return updatedComment;
};

export const deleteComment = async (userId: string, userRole: UserRole | string, commentId: string): Promise<void> => {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
        throw new NotFoundError(`Comment with ID ${commentId} not found`);
    }

    // Permite deletar se for o autor OU se for ADMIN
    if (comment.authorId !== userId && userRole !== UserRole.ADMIN) {
        throw new ForbiddenError("User is not authorized to delete this comment");
    }

    // A deleção em cascata (definida no schema) cuidará dos likes associados
    await prisma.comment.delete({ where: { id: commentId } });
};

