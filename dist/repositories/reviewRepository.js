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
const client_1 = require("@prisma/client");
// Função auxiliar para calcular e atualizar a média de avaliação
function updateAverageRating(tx, entityType, entityId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const aggregateResult = yield tx.review.aggregate({
            _avg: {
                rating: true,
            },
            _count: {
                _all: true,
            },
            where: {
                [`${entityType}Id`]: entityId,
            },
        });
        const newRating = (_a = aggregateResult._avg.rating) !== null && _a !== void 0 ? _a : 0;
        const newTotalReviews = aggregateResult._count._all;
        // Atualizar a entidade correspondente explicitamente
        try {
            if (entityType === 'company') {
                yield tx.company.update({
                    where: { id: entityId },
                    data: {
                        rating: newRating,
                        totalReviews: newTotalReviews,
                    },
                });
            }
            else if (entityType === 'professional') {
                yield tx.professional.update({
                    where: { id: entityId },
                    data: {
                        rating: newRating,
                        totalReviews: newTotalReviews,
                    },
                });
            }
            else if (entityType === 'service') {
                // TODO: Adicionar rating/totalReviews ao modelo Service se necessário
                // await tx.service.update({
                //   where: { id: entityId },
                //   data: {
                //     rating: newRating,
                //     totalReviews: newTotalReviews,
                //   },
                // });
                console.warn("Rating update for Service not implemented yet.");
            }
        }
        catch (e) {
            console.error(`Erro ao atualizar rating para ${entityType} ${entityId}:`, e);
            // Consider re-throwing if it's an unexpected error
        }
    });
}
exports.reviewRepository = {
    // Encontrar múltiplas avaliações com base em filtros
    findMany(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.review.findMany({
                where: filters,
                include: {
                    user: { select: { id: true, name: true, avatar: true } } // Incluir dados do usuário
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
        });
    },
    // Encontrar avaliações por serviço
    findByService(serviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findMany({ serviceId }); // Reutilizar findMany
        });
    },
    // Encontrar avaliações por profissional
    findByProfessional(professionalId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findMany({ professionalId }); // Reutilizar findMany
        });
    },
    // Encontrar avaliações por empresa
    findByCompany(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findMany({ companyId }); // Reutilizar findMany
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
            return prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const newReview = yield tx.review.create({
                    data,
                });
                const entityId = (_b = (_a = newReview.companyId) !== null && _a !== void 0 ? _a : newReview.professionalId) !== null && _b !== void 0 ? _b : newReview.serviceId;
                const entityType = newReview.companyId ? 'company' : newReview.professionalId ? 'professional' : 'service';
                if (entityId) {
                    yield updateAverageRating(tx, entityType, entityId);
                }
                return newReview;
            }));
        });
    },
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    const oldReview = yield tx.review.findUnique({ where: { id } });
                    if (!oldReview)
                        return null;
                    const updatedReview = yield tx.review.update({
                        where: { id },
                        data,
                    });
                    const entityId = (_b = (_a = updatedReview.companyId) !== null && _a !== void 0 ? _a : updatedReview.professionalId) !== null && _b !== void 0 ? _b : updatedReview.serviceId;
                    const entityType = updatedReview.companyId ? 'company' : updatedReview.professionalId ? 'professional' : 'service';
                    if (entityId) {
                        yield updateAverageRating(tx, entityType, entityId);
                    }
                    return updatedReview;
                }));
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                    return null;
                }
                throw error;
            }
        });
    },
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    const reviewToDelete = yield tx.review.findUnique({ where: { id } });
                    if (!reviewToDelete)
                        return null;
                    yield tx.review.delete({
                        where: { id },
                    });
                    const entityId = (_b = (_a = reviewToDelete.companyId) !== null && _a !== void 0 ? _a : reviewToDelete.professionalId) !== null && _b !== void 0 ? _b : reviewToDelete.serviceId;
                    const entityType = reviewToDelete.companyId ? 'company' : reviewToDelete.professionalId ? 'professional' : 'service';
                    if (entityId) {
                        yield updateAverageRating(tx, entityType, entityId);
                    }
                    return reviewToDelete;
                }));
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                    return null;
                }
                throw error;
            }
        });
    },
};
