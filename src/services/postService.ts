import { prisma } from "../lib/prisma";


import { Post, Prisma, UserRole } from "@prisma/client";
import { NotFoundError, ForbiddenError } from "../lib/errors";

// Interface/Tipo para os dados de criação/atualização (DTO)
interface PostData {
  title: string; // Added title as it is required by Prisma schema
  content: string;
  imageUrl?: string;
}

export const createPost = async (authorId: string, data: PostData): Promise<Post> => {
    // Verifica se o usuário existe (opcional, mas bom para clareza)
    const userExists = await prisma.user.findUnique({ where: { id: authorId } });
    if (!userExists) {
      throw new NotFoundError(`User with ID ${authorId} not found`);
    }

    const newPost = await prisma.post.create({
        data: {
            title: data.title, // Added title as it is required by Prisma schema
            content: data.content,
            imageUrl: data.imageUrl,
            authorId: authorId,
        },
        include: { // Inclui o autor para retornar informações básicas
            author: { select: { id: true, name: true, avatar: true } }
        }
    });
    return newPost;
};

export const getFeedPosts = async (page: number, limit: number): Promise<Post[]> => {
    const skip = (page - 1) * limit;
    const posts = await prisma.post.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            author: { select: { id: true, name: true, avatar: true } },
            _count: { select: { comments: true, likes: true } } // Conta comentários e likes
        }
    });
    return posts;
};

export const getUserPosts = async (userId: string, page: number, limit: number): Promise<Post[]> => {
    const skip = (page - 1) * limit;
    // Verifica se o usuário existe
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }

    const posts = await prisma.post.findMany({
        where: { authorId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            author: { select: { id: true, name: true, avatar: true } },
            _count: { select: { comments: true, likes: true } }
        }
    });
    return posts;
};

export const getPostById = async (postId: string): Promise<Post | null> => {
    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
            author: { select: { id: true, name: true, avatar: true } },
            comments: { // Inclui alguns comentários recentes como exemplo
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { author: { select: { id: true, name: true, avatar: true } } }
            },
            _count: { select: { comments: true, likes: true } }
        }
    });
    if (!post) {
        throw new NotFoundError(`Post with ID ${postId} not found`);
    }
    return post;
};

export const updatePost = async (userId: string, postId: string, data: Partial<PostData>): Promise<Post> => {
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
        throw new NotFoundError(`Post with ID ${postId} not found`);
    }

    if (post.authorId !== userId) {
        throw new ForbiddenError("User is not authorized to update this post");
    }

    const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
            content: data.content,
            imageUrl: data.imageUrl,
        },
         include: { // Retorna o post atualizado com informações do autor
            author: { select: { id: true, name: true, avatar: true } },
            _count: { select: { comments: true, likes: true } }
        }
    });
    return updatedPost;
};

export const deletePost = async (userId: string, userRole: UserRole | string, postId: string): Promise<void> => {
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
        throw new NotFoundError(`Post with ID ${postId} not found`);
    }

    // Permite deletar se for o autor OU se for ADMIN
    if (post.authorId !== userId && userRole !== UserRole.ADMIN) {
        throw new ForbiddenError("User is not authorized to delete this post");
    }

    // A deleção em cascata (definida no schema) cuidará dos comentários e likes associados
    await prisma.post.delete({ where: { id: postId } });
};

