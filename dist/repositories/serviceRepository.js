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
const client_1 = require("@prisma/client"); // Revertido: Importar de @prisma/client
exports.serviceRepository = {
    getAll(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.service.findMany({
                where: companyId ? { companyId } : {},
            });
        });
    },
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.service.findUnique({
                where: { id },
            });
        });
    },
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.service.create({
                data,
            });
        });
    },
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prisma_1.prisma.service.update({
                    where: { id },
                    data,
                });
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
                // Considerar desconectar de ProfessionalService antes de deletar
                yield prisma_1.prisma.professionalService.deleteMany({ where: { serviceId: id } });
                return yield prisma_1.prisma.service.delete({
                    where: { id },
                });
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
