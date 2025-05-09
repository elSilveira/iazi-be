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
exports.deleteComment = exports.updateComment = exports.getCommentsByPost = exports.createComment = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const errors_1 = require("../lib/errors");
const createComment = (userId, postId, content) => __awaiter(void 0, void 0, void 0, function* () {
    // Verifica se o usuário e o post existem
    const userExists = yield prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
        throw new errors_1.NotFoundError(`User with ID ${userId} not found`);
    }
    const postExists = yield prisma_1.prisma.post.findUnique({ where: { id: postId } });
    if (!postExists) {
        throw new errors_1.NotFoundError(`Post with ID ${postId} not found`);
    }
    const newComment = yield prisma_1.prisma.comment.create({
        data: {
            content,
            userId,
            postId,
        },
        include: {
            user: { select: { id: true, name: true, avatar: true } }
        }
    });
    return newComment;
});
exports.createComment = createComment;
const getCommentsByPost = (postId, page, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    // Verifica se o post existe
    const postExists = yield prisma_1.prisma.post.findUnique({ where: { id: postId } });
    if (!postExists) {
        throw new errors_1.NotFoundError(`Post with ID ${postId} not found`);
    }
    const comments = yield prisma_1.prisma.comment.findMany({
        where: { postId },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' }, // Ou 'desc' dependendo da ordem desejada
        include: {
            user: { select: { id: true, name: true, avatar: true } },
            _count: { select: { likes: true } } // Conta likes do comentário
        }
    });
    return comments;
});
exports.getCommentsByPost = getCommentsByPost;
const updateComment = (userId, commentId, content) => __awaiter(void 0, void 0, void 0, function* () {
    const comment = yield prisma_1.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
        throw new errors_1.NotFoundError(`Comment with ID ${commentId} not found`);
    }
    if (comment.userId !== userId) {
        throw new errors_1.ForbiddenError("User is not authorized to update this comment");
    }
    const updatedComment = yield prisma_1.prisma.comment.update({
        where: { id: commentId },
        data: { content },
        include: {
            user: { select: { id: true, name: true, avatar: true } },
            _count: { select: { likes: true } }
        }
    });
    return updatedComment;
});
exports.updateComment = updateComment;
const deleteComment = (userId, userRole, commentId) => __awaiter(void 0, void 0, void 0, function* () {
    const comment = yield prisma_1.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
        throw new errors_1.NotFoundError(`Comment with ID ${commentId} not found`);
    }
    // Permite deletar se for o autor OU se for ADMIN
    if (comment.userId !== userId && userRole !== client_1.UserRole.ADMIN) {
        throw new errors_1.ForbiddenError("User is not authorized to delete this comment");
    }
    // A deleção em cascata (definida no schema) cuidará dos likes associados
    yield prisma_1.prisma.comment.delete({ where: { id: commentId } });
});
exports.deleteComment = deleteComment;
