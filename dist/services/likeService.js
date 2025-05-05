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
exports.unlikeComment = exports.likeComment = exports.unlikePost = exports.likePost = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const errors_1 = require("../lib/errors");
const likePost = (userId, postId) => __awaiter(void 0, void 0, void 0, function* () {
    // Verifica se o usuário e o post existem
    const userExists = yield prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
        throw new errors_1.NotFoundError(`User with ID ${userId} not found`);
    }
    const postExists = yield prisma_1.prisma.post.findUnique({ where: { id: postId } });
    if (!postExists) {
        throw new errors_1.NotFoundError(`Post with ID ${postId} not found`);
    }
    try {
        // Tenta criar o like. A constraint unique(userId, postId) no schema previne duplicados.
        const newLike = yield prisma_1.prisma.like.create({
            data: {
                userId,
                postId,
            },
            include: {
                user: { select: { id: true, name: true } },
                post: { select: { id: true, content: true } }
            }
        });
        return newLike;
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            // P2002 é o código para unique constraint violation
            throw new errors_1.ConflictError("User has already liked this post");
        }
        // Re-lança outros erros inesperados
        throw error;
    }
});
exports.likePost = likePost;
const unlikePost = (userId, postId) => __awaiter(void 0, void 0, void 0, function* () {
    // Não precisamos verificar existência do usuário/post aqui, pois o deleteMany não falhará se não encontrar.
    // A lógica é: deletar o like se ele existir.
    const deleteResult = yield prisma_1.prisma.like.deleteMany({
        where: {
            userId,
            postId,
        }
    });
    // Se nenhum like foi deletado, significa que o usuário não tinha curtido o post.
    if (deleteResult.count === 0) {
        // Lançar erro ou retornar silenciosamente? Depende da UX desejada.
        // Lançar erro é mais explícito sobre o estado.
        throw new errors_1.NotFoundError("Like not found for this user and post, cannot unlike.");
    }
    // Se count > 0, a operação foi bem-sucedida.
});
exports.unlikePost = unlikePost;
const likeComment = (userId, commentId) => __awaiter(void 0, void 0, void 0, function* () {
    // Verifica se o usuário e o comentário existem
    const userExists = yield prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
        throw new errors_1.NotFoundError(`User with ID ${userId} not found`);
    }
    const commentExists = yield prisma_1.prisma.comment.findUnique({ where: { id: commentId } });
    if (!commentExists) {
        throw new errors_1.NotFoundError(`Comment with ID ${commentId} not found`);
    }
    try {
        // Tenta criar o like no comentário. Constraint unique(userId, commentId).
        const newLike = yield prisma_1.prisma.like.create({
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
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new errors_1.ConflictError("User has already liked this comment");
        }
        throw error;
    }
});
exports.likeComment = likeComment;
const unlikeComment = (userId, commentId) => __awaiter(void 0, void 0, void 0, function* () {
    // Deleta o like se ele existir.
    const deleteResult = yield prisma_1.prisma.like.deleteMany({
        where: {
            userId,
            commentId,
        }
    });
    if (deleteResult.count === 0) {
        throw new errors_1.NotFoundError("Like not found for this user and comment, cannot unlike.");
    }
});
exports.unlikeComment = unlikeComment;
