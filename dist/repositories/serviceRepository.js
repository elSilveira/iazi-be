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
exports.serviceRepository = void 0;
const prisma_1 = require("../lib/prisma");
exports.serviceRepository = {
    // Método antigo, pode ser removido ou mantido para compatibilidade se necessário
    getAll(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.service.findMany({
                where: companyId ? { companyId } : {},
                include: { category: true } // Incluir categoria por padrão?
            });
        });
    },
    // Novo método findMany com filtros, ordenação e paginação
    findMany(filters, orderBy, skip, take) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.service.findMany({
                where: filters,
                orderBy: orderBy,
                skip: skip,
                take: take,
                include: {
                    category: true, // Incluir dados da categoria
                    company: {
                        select: {
                            id: true,
                            name: true,
                            address: true // Incluir endereço da empresa
                        }
                    }
                }
            });
        });
    },
    // Novo método count com filtros
    count(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.service.count({
                where: filters,
            });
        });
    },
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.service.findUnique({
                where: { id },
                include: {
                    category: true,
                    company: true,
                    professionals: { include: { professional: true } } // Incluir profissionais associados
                }
            });
        });
    },
    findWithProfessionals() {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.service.findMany({
                where: {
                    professionals: {
                        some: {}, // At least one professional linked
                    },
                },
                include: {
                    professionals: { include: { professional: true } },
                    category: true,
                    company: true,
                },
            });
        });
    },
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Remove 'company' property if it is not present or not needed
            const cleanData = Object.assign({}, data);
            if (typeof cleanData.company === 'undefined') {
                delete cleanData.company;
            }
            // Do NOT add companyId at all for professionals (it is handled by the relation, not as a direct field)
            return prisma_1.prisma.service.create({
                data: cleanData,
            });
        });
    },
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // O update do Prisma já lança P2025 se não encontrar, não precisa de try/catch aqui
            return prisma_1.prisma.service.update({
                where: { id },
                data,
            });
        });
    },
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // O delete do Prisma já lança P2025 se não encontrar
            // A exclusão em cascata ou restrições FK devem ser tratadas no schema ou no controller
            // Desconectar relações many-to-many antes de deletar
            yield prisma_1.prisma.professionalService.deleteMany({ where: { serviceId: id } });
            // TODO: Deletar Appointments e Reviews associados ou definir onDelete no schema?
            return prisma_1.prisma.service.delete({
                where: { id },
            });
        });
    },
    // Link a professional to a service (with price, schedule, description)
    linkProfessionalToService(professionalId, serviceId, price, schedule, description) {
        return __awaiter(this, void 0, void 0, function* () {
            yield prisma_1.prisma.professionalService.create({
                data: { professionalId, serviceId, price, schedule, description },
            });
        });
    },
    // Unlink a professional from a service
    unlinkProfessionalFromService(professionalId, serviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield prisma_1.prisma.professionalService.delete({
                where: { professionalId_serviceId: { professionalId, serviceId } },
            });
        });
    },
    // List all professionals linked to a service
    getProfessionalsByService(serviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.professionalService.findMany({
                where: { serviceId },
                include: { professional: true },
            });
        });
    },
    // List all services linked to a professional (include join fields)
    getServicesByProfessional(professionalId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.professionalService.findMany({
                where: { professionalId },
                include: { service: true },
            });
        });
    },
};
