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
    // Define the include object for consistency
    includeDetails: {
        services: { include: { service: true } },
        professional: {
            include: {
                company: { include: { address: true } },
                services: { include: { service: true } },
            },
        },
        company: true,
        user: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
    }, // Use 'as const' for stricter type checking
    // Encontrar múltiplos agendamentos com base em filtros
    findMany(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.appointment.findMany({
                where: filters,
                include: this.includeDetails,
                orderBy: {
                    startTime: "asc", // Ordenar por horário de início
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
                include: this.includeDetails,
            });
        });
    },
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const newAppointment = yield prisma_1.prisma.appointment.create({
                data,
            });
            // Re-fetch with includes to ensure the correct return type
            return prisma_1.prisma.appointment.findUniqueOrThrow({
                where: { id: newAppointment.id },
                include: this.includeDetails,
            });
        });
    },
    updateStatus(id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const updatedAppointment = yield prisma_1.prisma.appointment.update({
                    where: { id },
                    data: { status },
                });
                // Re-fetch with includes
                return prisma_1.prisma.appointment.findUnique({
                    where: { id: updatedAppointment.id },
                    include: this.includeDetails,
                });
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                    return null; // Agendamento não encontrado
                }
                throw error;
            }
        });
    },
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Fetch before deleting to return the full object (optional, depends on need)
                const appointmentToDelete = yield prisma_1.prisma.appointment.findUnique({
                    where: { id },
                    include: this.includeDetails,
                });
                if (!appointmentToDelete)
                    return null; // Already gone
                yield prisma_1.prisma.appointment.delete({
                    where: { id },
                });
                return appointmentToDelete; // Return the fetched object
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                    return null; // Agendamento não encontrado
                }
                throw error;
            }
        });
    },
};
