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
        experiences: true, // Maps to ProfessionalExperience model
        education: true, // Maps to ProfessionalEducation model
        availability: true, // Maps to ProfessionalAvailabilitySlot model
        portfolio: true, // Maps to ProfessionalPortfolioItem model
    },
    getAll(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.professional.findMany({
                where: companyId ? { companyId } : {},
                include: this.includeDetails,
            });
        });
    },
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
    create(data, serviceIds, experiencesData, educationsData, availabilityData, portfolioData) {
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
                if (experiencesData && experiencesData.length > 0) {
                    yield tx.professionalExperience.createMany({
                        data: experiencesData.map(exp => (Object.assign(Object.assign({}, exp), { professionalId: newProfessional.id }))),
                    });
                }
                if (educationsData && educationsData.length > 0) {
                    yield tx.professionalEducation.createMany({
                        data: educationsData.map(edu => (Object.assign(Object.assign({}, edu), { professionalId: newProfessional.id }))),
                    });
                }
                if (availabilityData && availabilityData.length > 0) {
                    yield tx.professionalAvailabilitySlot.createMany({
                        data: availabilityData.map(slot => (Object.assign(Object.assign({}, slot), { professionalId: newProfessional.id }))),
                    });
                }
                if (portfolioData && portfolioData.length > 0) {
                    yield tx.professionalPortfolioItem.createMany({
                        data: portfolioData.map(item => (Object.assign(Object.assign({}, item), { professionalId: newProfessional.id }))),
                    });
                }
                return tx.professional.findUniqueOrThrow({
                    where: { id: newProfessional.id },
                    include: this.includeDetails,
                });
            }));
        });
    },
    update(id, data, serviceIds, experiencesData, educationsData, availabilityData, portfolioData) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const updatedProfessional = yield tx.professional.update({
                    where: { id },
                    data,
                });
                if (serviceIds !== undefined) {
                    yield tx.professionalService.deleteMany({ where: { professionalId: id } });
                    if (serviceIds.length > 0) {
                        yield tx.professionalService.createMany({
                            data: serviceIds.map((serviceId) => ({ professionalId: id, serviceId: serviceId })),
                            skipDuplicates: true,
                        });
                    }
                }
                if (experiencesData !== undefined) {
                    yield tx.professionalExperience.deleteMany({ where: { professionalId: id } });
                    if (experiencesData.length > 0) {
                        yield tx.professionalExperience.createMany({
                            data: experiencesData.map(exp => (Object.assign(Object.assign({}, exp), { professionalId: id }))),
                        });
                    }
                }
                if (educationsData !== undefined) {
                    yield tx.professionalEducation.deleteMany({ where: { professionalId: id } });
                    if (educationsData.length > 0) {
                        yield tx.professionalEducation.createMany({
                            data: educationsData.map(edu => (Object.assign(Object.assign({}, edu), { professionalId: id }))),
                        });
                    }
                }
                if (availabilityData !== undefined) {
                    yield tx.professionalAvailabilitySlot.deleteMany({ where: { professionalId: id } });
                    if (availabilityData.length > 0) {
                        yield tx.professionalAvailabilitySlot.createMany({
                            data: availabilityData.map(slot => (Object.assign(Object.assign({}, slot), { professionalId: id }))),
                        });
                    }
                }
                if (portfolioData !== undefined) {
                    yield tx.professionalPortfolioItem.deleteMany({ where: { professionalId: id } });
                    if (portfolioData.length > 0) {
                        yield tx.professionalPortfolioItem.createMany({
                            data: portfolioData.map(item => (Object.assign(Object.assign({}, item), { professionalId: id }))),
                        });
                    }
                }
                return tx.professional.findUniqueOrThrow({
                    where: { id: updatedProfessional.id },
                    include: this.includeDetails,
                });
            }));
        });
    },
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                yield tx.professionalService.deleteMany({ where: { professionalId: id } });
                yield tx.professionalExperience.deleteMany({ where: { professionalId: id } });
                yield tx.professionalEducation.deleteMany({ where: { professionalId: id } });
                yield tx.professionalAvailabilitySlot.deleteMany({ where: { professionalId: id } });
                yield tx.professionalPortfolioItem.deleteMany({ where: { professionalId: id } });
                yield tx.review.updateMany({
                    where: { professionalId: id },
                    data: { professionalId: null }
                });
                // Note: onDelete: Cascade for appointments and scheduleBlocks should be handled by schema if set
                // If not, they might need explicit deletion or update here.
                const deletedProfessional = yield tx.professional.delete({
                    where: { id },
                });
                return deletedProfessional;
            }));
        });
    },
};
