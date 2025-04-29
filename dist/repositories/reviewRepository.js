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
exports.reviewRepository = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client"); // Revertido: Importar de @prisma/client
exports.reviewRepository = {
    // Encontrar avaliações por serviço
    findByService(serviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.review.findMany({
                where: { serviceId },
                include: {
                    user: { select: { id: true, name: true, avatar: true } } // Incluir dados do usuário
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
        });
    },
    // Encontrar avaliações por profissional
    findByProfessional(professionalId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.review.findMany({
                where: { professionalId },
                include: {
                    user: { select: { id: true, name: true, avatar: true } }
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
        });
    },
    // Encontrar avaliações por empresa
    findByCompany(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.review.findMany({
                where: { companyId },
                include: {
                    user: { select: { id: true, name: true, avatar: true } }
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
        });
    },
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.review.findUnique({
                where: { id },
                include: {
                    user: { select: { id: true, name: true, avatar: true } }
                },
            });
        });
    },
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.review.create({
                data,
            });
        });
    },
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prisma_1.prisma.review.update({
                    where: { id },
                    data,
                });
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                    return null; // Avaliação não encontrada
                }
                throw error;
            }
        });
    },
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prisma_1.prisma.review.delete({
                    where: { id },
                });
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                    return null; // Avaliação não encontrada
                }
                throw error;
            }
        });
    },
};
