import { prisma } from "../lib/prisma";
import { Like, Prisma, UserRole } from "@prisma/client";
import { NotFoundError, ForbiddenError, ConflictError } from "../lib/errors";

export const likePost = async (userId: string, postId: string): Promise<Like> => {
    // Verifica se o usuário e o post existem
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
        throw new NotFoundError(`User with ID ${userId} not found`);
    }
    const postExists = await prisma.post.findUnique({ where: { id: postId } });
    if (!postExists) {
        throw new NotFoundError(`Post with ID ${postId} not found`);
    }

    try {
        // Tenta criar o like. A constraint unique(userId, postId) no schema previne duplicados.
        const newLike = await prisma.like.create({
            data: {
                userId,
                postId,
            },
            include: { // Inclui usuário e post para referência, se necessário
                user: { select: { id: true, name: true } },
                post: { select: { id: true, content: true } }
            }
        });
        return newLike;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            // P2002 é o código para unique constraint violation
            throw new ConflictError("User has already liked this post");
        }
        // Re-lança outros erros inesperados
        throw error;
    }
};

export const unlikePost = async (userId: string, postId: string): Promise<void> => {
    // Não precisamos verificar existência do usuário/post aqui, pois o deleteMany não falhará se não encontrar.
    // A lógica é: deletar o like se ele existir.

    const deleteResult = await prisma.like.deleteMany({
        where: {
            userId,
            postId,
        }
    });

    // Se nenhum like foi deletado, significa que o usuário não tinha curtido o post.
    if (deleteResult.count === 0) {
        // Lançar erro ou retornar silenciosamente? Depende da UX desejada.
        // Lançar erro é mais explícito sobre o estado.
        throw new NotFoundError("Like not found for this user and post, cannot unlike.");
    }
    // Se count > 0, a operação foi bem-sucedida.
};

export const likeComment = async (userId: string, commentId: string): Promise<Like> => {
    // Verifica se o usuário e o comentário existem
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
        throw new NotFoundError(`User with ID ${userId} not found`);
    }
    const commentExists = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!commentExists) {
        throw new NotFoundError(`Comment with ID ${commentId} not found`);
    }

    try {
        // Tenta criar o like no comentário. Constraint unique(userId, commentId).
        const newLike = await prisma.like.create({
            data: {
                userId,
                commentId,
            },
            include: {
                user: { select: { id: true, name: true } },
                comment: { select: { id: true, content: true } }
            }
        });
        return newLike;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new ConflictError("User has already liked this comment");
        }
        throw error;
    }
};

export const unlikeComment = async (userId: string, commentId: string): Promise<void> => {
    // Deleta o like se ele existir.
    const deleteResult = await prisma.like.deleteMany({
        where: {
            userId,
            commentId,
        }
    });

    if (deleteResult.count === 0) {
        throw new NotFoundError("Like not found for this user and comment, cannot unlike.");
    }
};

