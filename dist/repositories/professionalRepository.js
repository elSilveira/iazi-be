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
const client_1 = require("@prisma/client"); // Revertido: Importar de @prisma/client
exports.professionalRepository = {
    getAll(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.professional.findMany({
                where: companyId ? { companyId } : {},
                include: { services: { include: { service: true } } }, // Incluir serviços associados
            });
        });
    },
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.professional.findUnique({
                where: { id },
                include: { services: { include: { service: true } } }, // Incluir serviços associados
            });
        });
    },
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // A conexão com serviços (ProfessionalService) deve ser tratada separadamente
            return prisma_1.prisma.professional.create({
                data,
            });
        });
    },
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // A atualização da conexão com serviços deve ser tratada separadamente
            try {
                return yield prisma_1.prisma.professional.update({
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
                // Desconectar de ProfessionalService antes de deletar
                yield prisma_1.prisma.professionalService.deleteMany({ where: { professionalId: id } });
                // Considerar o que fazer com agendamentos e avaliações associados
                // await prisma.appointment.updateMany({ where: { professionalId: id }, data: { professionalId: null } }); // Exemplo: Desassociar
                // await prisma.review.updateMany({ where: { professionalId: id }, data: { professionalId: null } }); // Exemplo: Desassociar
                return yield prisma_1.prisma.professional.delete({
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
