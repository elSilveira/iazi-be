"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePost = exports.updatePost = exports.getPostById = exports.getUserPosts = exports.getFeedPosts = exports.createPost = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const errors_1 = require("../lib/errors");
const createPost = (userId, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Verifica se o usuário existe (opcional, mas bom para clareza)
    const userExists = yield prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
        throw new errors_1.NotFoundError(`User with ID ${userId} not found`);
    }
    const newPost = yield prisma_1.prisma.post.create({
        data: {
            content: data.content,
            imageUrl: data.imageUrl,
            userId: userId,
        },
        include: {
            user: { select: { id: true, name: true, avatar: true } }
        }
    });
    return newPost;
});
exports.createPost = createPost;
const getFeedPosts = (page, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    const posts = yield prisma_1.prisma.post.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { id: true, name: true, avatar: true } },
            _count: { select: { comments: true, likes: true } } // Conta comentários e likes
        }
    });
    return posts;
});
exports.getFeedPosts = getFeedPosts;
const getUserPosts = (userId, page, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    // Verifica se o usuário existe
    const userExists = yield prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
        throw new errors_1.NotFoundError(`User with ID ${userId} not found`);
    }
    const posts = yield prisma_1.prisma.post.findMany({
        where: { userId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { id: true, name: true, avatar: true } },
            _count: { select: { comments: true, likes: true } }
        }
    });
    return posts;
});
exports.getUserPosts = getUserPosts;
const getPostById = (postId) => __awaiter(void 0, void 0, void 0, function* () {
    const post = yield prisma_1.prisma.post.findUnique({
        where: { id: postId },
        include: {
            user: { select: { id: true, name: true, avatar: true } },
            comments: {
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { user: { select: { id: true, name: true, avatar: true } } }
            },
            _count: { select: { comments: true, likes: true } }
        }
    });
    if (!post) {
        throw new errors_1.NotFoundError(`Post with ID ${postId} not found`);
    }
    return post;
});
exports.getPostById = getPostById;
const updatePost = (userId, postId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const post = yield prisma_1.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
        throw new errors_1.NotFoundError(`Post with ID ${postId} not found`);
    }
    if (post.userId !== userId) {
        throw new errors_1.ForbiddenError("User is not authorized to update this post");
    }
    const updatedPost = yield prisma_1.prisma.post.update({
        where: { id: postId },
        data: {
            content: data.content,
            imageUrl: data.imageUrl,
        },
        include: {
            user: { select: { id: true, name: true, avatar: true } },
            _count: { select: { comments: true, likes: true } }
        }
    });
    return updatedPost;
});
exports.updatePost = updatePost;
const deletePost = (userId, userRole, postId) => __awaiter(void 0, void 0, void 0, function* () {
    const post = yield prisma_1.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
        throw new errors_1.NotFoundError(`Post with ID ${postId} not found`);
    }
    // Permite deletar se for o autor OU se for ADMIN
    if (post.userId !== userId && userRole !== client_1.UserRole.ADMIN) {
        throw new errors_1.ForbiddenError("User is not authorized to delete this post");
    }
    // A deleção em cascata (definida no schema) cuidará dos comentários e likes associados
    yield prisma_1.prisma.post.delete({ where: { id: postId } });
});
exports.deletePost = deletePost;
