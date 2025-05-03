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
exports.appointmentRepository = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
exports.appointmentRepository = {
    // Encontrar múltiplos agendamentos com base em filtros
    findMany(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.appointment.findMany({
                where: filters,
                include: {
                    service: true,
                    professional: true,
                    user: { select: { id: true, name: true, email: true, avatar: true } } // Incluir dados relevantes do usuário
                },
                orderBy: {
                    date: 'asc', // Ordenar por data
                },
            });
        });
    },
    // Encontrar agendamentos por usuário (opcionalmente por status)
    findByUser(userId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findMany(Object.assign({ // Reutilizar findMany
                userId }, (status && { status })));
        });
    },
    // Encontrar agendamentos por profissional (poderia adicionar filtro de data)
    findByProfessional(professionalId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findMany({
                professionalId,
            });
        });
    },
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.appointment.findUnique({
                where: { id },
                include: {
                    service: true,
                    professional: true,
                    user: { select: { id: true, name: true, email: true, avatar: true } }
                },
            });
        });
    },
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.appointment.create({
                data,
            });
        });
    },
    updateStatus(id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prisma_1.prisma.appointment.update({
                    where: { id },
                    data: { status },
                });
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                    return null; // Agendamento não encontrado
                }
                throw error;
            }
        });
    },
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prisma_1.prisma.appointment.delete({
                    where: { id },
                });
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                    return null; // Agendamento não encontrado
                }
                throw error;
            }
        });
    },
};
