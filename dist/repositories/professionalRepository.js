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
    // Define the include object for consistency
    includeDetails: {
        services: { include: { service: true } },
        company: { include: { address: true } },
    },
    // Método antigo, pode ser removido ou mantido
    getAll(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.professional.findMany({
                where: companyId ? { companyId } : {},
                include: this.includeDetails,
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
                include: this.includeDetails,
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
                include: this.includeDetails,
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
                // Re-fetch with includes
                return tx.professional.findUniqueOrThrow({
                    where: { id: newProfessional.id },
                    include: this.includeDetails,
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
                    // Include details directly in update if possible, otherwise re-fetch
                    // include: this.includeDetails, // Include might not work directly with serviceIds logic
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
                // Re-fetch with includes
                return tx.professional.findUniqueOrThrow({
                    where: { id: updatedProfessional.id },
                    include: this.includeDetails,
                });
            }));
        });
    },
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // Prisma delete throws P2025 if record not found
            return prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // Fetch before deleting to potentially return details (optional)
                // const professionalToDelete = await tx.professional.findUnique({ 
                //     where: { id }, 
                //     include: this.includeDetails 
                // });
                // if (!professionalToDelete) throw new Prisma.PrismaClientKnownRequestError("Professional not found", { code: "P2025", clientVersion: "" });
                yield tx.professionalService.deleteMany({ where: { professionalId: id } });
                // onDelete: SetNull for appointments should be handled by schema
                yield tx.review.updateMany({
                    where: { professionalId: id },
                    data: { professionalId: null }
                });
                const deletedProfessional = yield tx.professional.delete({
                    where: { id },
                });
                return deletedProfessional; // Return the basic deleted object
                // return professionalToDelete; // Or return the object with details fetched before delete
            }));
        });
    },
};
