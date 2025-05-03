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
exports.professionalRepository = void 0;
const prisma_1 = require("../lib/prisma");
exports.professionalRepository = {
    // Método antigo, pode ser removido ou mantido
    getAll(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.professional.findMany({
                where: companyId ? { companyId } : {},
                include: {
                    services: { include: { service: true } },
                    company: { include: { address: true } } // Incluir empresa e endereço
                },
            });
        });
    },
    // Novo método findMany com filtros, ordenação e paginação
    findMany(filters, orderBy, skip, take) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.professional.findMany({
                where: filters,
                orderBy: orderBy,
                skip: skip,
                take: take,
                include: {
                    services: { include: { service: true } }, // Incluir serviços associados
                    company: { include: { address: true } } // Incluir empresa e endereço
                }
            });
        });
    },
    // Novo método count com filtros
    count(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.professional.count({
                where: filters,
            });
        });
    },
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.professional.findUnique({
                where: { id },
                include: {
                    services: { include: { service: true } }, // Incluir serviços associados
                    company: { include: { address: true } } // Incluir empresa e endereço
                },
            });
        });
    },
    create(data, serviceIds) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const newProfessional = yield tx.professional.create({
                    data,
                });
                if (serviceIds && serviceIds.length > 0) {
                    const serviceConnections = serviceIds.map((serviceId) => ({
                        professionalId: newProfessional.id,
                        serviceId: serviceId,
                    }));
                    yield tx.professionalService.createMany({
                        data: serviceConnections,
                        skipDuplicates: true,
                    });
                }
                return tx.professional.findUniqueOrThrow({
                    where: { id: newProfessional.id },
                    include: { services: { include: { service: true } } },
                });
            }));
        });
    },
    update(id, data, serviceIds) {
        return __awaiter(this, void 0, void 0, function* () {
            // Prisma update throws P2025 if record not found
            return prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const updatedProfessional = yield tx.professional.update({
                    where: { id },
                    data,
                });
                if (serviceIds !== undefined) {
                    yield tx.professionalService.deleteMany({
                        where: { professionalId: id },
                    });
                    if (serviceIds.length > 0) {
                        const serviceConnections = serviceIds.map((serviceId) => ({
                            professionalId: id,
                            serviceId: serviceId,
                        }));
                        yield tx.professionalService.createMany({
                            data: serviceConnections,
                            skipDuplicates: true,
                        });
                    }
                }
                return tx.professional.findUniqueOrThrow({
                    where: { id: updatedProfessional.id },
                    include: { services: { include: { service: true } } },
                });
            }));
        });
    },
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // Prisma delete throws P2025 if record not found
            return prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                yield tx.professionalService.deleteMany({ where: { professionalId: id } });
                // onDelete: SetNull for appointments should be handled by schema
                yield tx.review.updateMany({
                    where: { professionalId: id },
                    data: { professionalId: null }
                });
                const deletedProfessional = yield tx.professional.delete({
                    where: { id },
                });
                return deletedProfessional;
            }));
        });
    },
};
