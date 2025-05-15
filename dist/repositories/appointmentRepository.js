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
// Enhanced logging for debugging
const DEBUG_MODE = process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true';
function logDebug(message, data) {
    // Always log in development, or if DEBUG=true in production
    if (DEBUG_MODE) {
        console.log(`[AppointmentRepository] ${message}`);
        if (data) {
            console.log(JSON.stringify(data, null, 2));
        }
    }
}
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
            logDebug(`Finding appointments with filters`, filters);
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
            logDebug(`Finding appointments for user ${userId}${status ? ` with status ${status}` : ''}`);
            return this.findMany(Object.assign({ // Reutilizar findMany
                userId }, (status && { status })));
        });
    },
    // Encontrar agendamentos por profissional (poderia adicionar filtro de data)
    findByProfessional(professionalId) {
        return __awaiter(this, void 0, void 0, function* () {
            logDebug(`Finding appointments for professional ${professionalId}`);
            return this.findMany({
                professionalId,
            });
        });
    },
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            logDebug(`Finding appointment by id ${id}`);
            return prisma_1.prisma.appointment.findUnique({
                where: { id },
                include: this.includeDetails,
            });
        });
    },
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            logDebug(`Creating new appointment`, {
                professionalId: (_b = (_a = data.professional) === null || _a === void 0 ? void 0 : _a.connect) === null || _b === void 0 ? void 0 : _b.id,
                userId: (_d = (_c = data.user) === null || _c === void 0 ? void 0 : _c.connect) === null || _d === void 0 ? void 0 : _d.id,
                startTime: data.startTime,
                serviceCount: ((_e = data.services) === null || _e === void 0 ? void 0 : _e.create) ?
                    (Array.isArray(data.services.create) ? data.services.create.length : 1) : 0
            });
            const newAppointment = yield prisma_1.prisma.appointment.create({
                data,
            });
            logDebug(`Created appointment with ID: ${newAppointment.id}`);
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
                logDebug(`Updating appointment ${id} to status ${status}`);
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
                    logDebug(`Appointment ${id} not found during status update`);
                    return null; // Agendamento não encontrado
                }
                logDebug(`Error updating appointment status: ${error.message}`);
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
                if (!appointmentToDelete) {
                    logDebug(`Appointment ${id} not found for deletion`);
                    return null;
                }
                logDebug(`Deleting appointment ${id}`);
                yield prisma_1.prisma.appointment.delete({
                    where: { id },
                });
                return appointmentToDelete;
            }
            catch (error) {
                logDebug(`Error deleting appointment: ${error.message}`);
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                    return null; // Agendamento não encontrado
                }
                throw error;
            }
        });
    }
};
