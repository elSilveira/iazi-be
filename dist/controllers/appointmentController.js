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
exports.deleteAppointment = exports.cancelAppointment = exports.updateAppointmentStatus = exports.createAppointment = exports.getAppointmentById = exports.getAllAppointments = void 0;
const appointmentRepository_1 = require("../repositories/appointmentRepository");
const client_1 = require("@prisma/client");
// Helper function for UUID validation
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
};
// Obter todos os agendamentos (com filtros opcionais)
const getAllAppointments = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { professionalId, status } = req.query;
    let userId = req.query.userId;
    // If userId query param is not provided, try to get it from the authenticated user
    if (!userId && ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
        userId = req.user.id;
    }
    // Validar IDs se fornecidos
    if (userId && !isValidUUID(userId)) {
        res.status(400).json({ message: 'Formato de ID do usuário inválido.' });
        return;
    }
    if (professionalId && !isValidUUID(professionalId)) {
        res.status(400).json({ message: 'Formato de ID do profissional inválido.' });
        return;
    }
    // Validar status se fornecido
    if (status && !Object.values(client_1.AppointmentStatus).includes(status)) {
        res.status(400).json({
            message: 'Status inválido. Valores permitidos: ' + Object.values(client_1.AppointmentStatus).join(', ')
        });
        return;
    }
    try {
        let appointments;
        // Simplificando a lógica de busca - o repositório pode lidar com filtros
        const filters = {};
        if (userId)
            filters.userId = userId;
        if (professionalId)
            filters.professionalId = professionalId;
        if (status)
            filters.status = status;
        // Se nenhum filtro principal for fornecido (nem userId da query/token, nem professionalId), retornar erro.
        if (!userId && !professionalId) {
            res.status(400).json({ message: 'É necessário fornecer userId (ou estar autenticado) ou professionalId para filtrar os agendamentos' });
            return;
        }
        appointments = yield appointmentRepository_1.appointmentRepository.findMany(filters);
        res.json(appointments);
    }
    catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
        next(error); // Pass error to error handler
    }
});
exports.getAllAppointments = getAllAppointments;
// Obter um agendamento específico pelo ID
const getAppointmentById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // Validar formato do ID
    if (!isValidUUID(id)) {
        res.status(400).json({ message: "Formato de ID inválido." });
        return;
    }
    try {
        const appointment = yield appointmentRepository_1.appointmentRepository.findById(id);
        if (!appointment) {
            res.status(404).json({ message: 'Agendamento não encontrado' });
            return;
        }
        res.json(appointment);
    }
    catch (error) {
        console.error(`Erro ao buscar agendamento ${id}:`, error);
        next(error); // Pass error to error handler
    }
});
exports.getAppointmentById = getAppointmentById;
// Criar um novo agendamento
const createAppointment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // Extrair dados do corpo da requisição
    const { date, serviceId, professionalId, notes } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Get userId from authenticated user
    // Validação (Idealmente feita com express-validator)
    if (!date || !serviceId || !professionalId) {
        res.status(400).json({
            message: 'Data, ID do serviço e ID do profissional são obrigatórios'
        });
        return;
    }
    if (!userId) { // Check if userId was obtained from token
        res.status(401).json({ message: 'Usuário não autenticado.' });
        return;
    }
    if (!isValidUUID(serviceId) || !isValidUUID(professionalId)) {
        res.status(400).json({ message: 'Formato de ID inválido para serviço ou profissional.' });
        return;
    }
    try {
        const appointmentDate = new Date(date);
        if (isNaN(appointmentDate.getTime())) {
            res.status(400).json({ message: 'Formato de data inválido.' });
            return;
        }
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (appointmentDate < now) {
            res.status(400).json({ message: 'A data do agendamento não pode ser no passado' });
            return;
        }
        const dataToCreate = {
            date: appointmentDate,
            user: { connect: { id: userId } }, // Use userId from token
            service: { connect: { id: serviceId } },
            professional: { connect: { id: professionalId } },
            notes: notes,
        };
        const newAppointment = yield appointmentRepository_1.appointmentRepository.create(dataToCreate);
        res.status(201).json(newAppointment);
    }
    catch (error) {
        console.error('Erro ao criar agendamento:', error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            // Check which foreign key constraint failed
            const target = (_b = error.meta) === null || _b === void 0 ? void 0 : _b.target;
            if (target && target.includes('userId')) {
                res.status(400).json({ message: 'ID do usuário inválido.' });
            }
            else if (target && target.includes('serviceId')) {
                res.status(400).json({ message: 'ID do serviço inválido.' });
            }
            else if (target && target.includes('professionalId')) {
                res.status(400).json({ message: 'ID do profissional inválido.' });
            }
            else {
                res.status(400).json({ message: 'Um ou mais IDs fornecidos são inválidos.' });
            }
            return;
        }
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            // This can happen if serviceId or professionalId doesn't exist
            res.status(404).json({ message: 'Serviço ou Profissional não encontrado.' });
            return;
        }
        next(error); // Pass other errors to error handler
    }
});
exports.createAppointment = createAppointment;
// Atualizar o status de um agendamento
const updateAppointmentStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!isValidUUID(id)) {
        res.status(400).json({ message: "Formato de ID inválido." });
        return;
    }
    const { status } = req.body;
    if (!status || !Object.values(client_1.AppointmentStatus).includes(status)) {
        res.status(400).json({
            message: 'Status inválido. Valores permitidos: ' + Object.values(client_1.AppointmentStatus).join(', ')
        });
        return;
    }
    try {
        // TODO: Add authorization check - does the authenticated user own this appointment or is a professional/admin?
        const updatedAppointment = yield appointmentRepository_1.appointmentRepository.updateStatus(id, status);
        if (!updatedAppointment) {
            res.status(404).json({ message: 'Agendamento não encontrado para atualização' });
            return;
        }
        res.json(updatedAppointment);
    }
    catch (error) {
        console.error(`Erro ao atualizar status do agendamento ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: 'Agendamento não encontrado para atualização.' });
            return;
        }
        next(error); // Pass other errors to error handler
    }
});
exports.updateAppointmentStatus = updateAppointmentStatus;
// Cancelar um agendamento (caso especial de atualização de status)
const cancelAppointment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!isValidUUID(id)) {
        res.status(400).json({ message: "Formato de ID inválido." });
        return;
    }
    try {
        // TODO: Add authorization check - does the authenticated user own this appointment?
        const updatedAppointment = yield appointmentRepository_1.appointmentRepository.updateStatus(id, client_1.AppointmentStatus.CANCELLED);
        if (!updatedAppointment) {
            res.status(404).json({ message: 'Agendamento não encontrado para cancelamento' });
            return;
        }
        res.json({
            message: 'Agendamento cancelado com sucesso',
            appointment: updatedAppointment
        });
    }
    catch (error) {
        console.error(`Erro ao cancelar agendamento ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: 'Agendamento não encontrado para cancelamento.' });
            return;
        }
        next(error); // Pass other errors to error handler
    }
});
exports.cancelAppointment = cancelAppointment;
// Deletar um agendamento (geralmente não recomendado, preferir cancelamento)
const deleteAppointment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!isValidUUID(id)) {
        res.status(400).json({ message: "Formato de ID inválido." });
        return;
    }
    try {
        // TODO: Add authorization check - does the authenticated user own this appointment?
        const deletedAppointment = yield appointmentRepository_1.appointmentRepository.delete(id);
        if (!deletedAppointment) {
            res.status(404).json({ message: 'Agendamento não encontrado para exclusão' });
            return;
        }
        // Use 204 No Content for successful deletion
        res.status(204).send();
    }
    catch (error) {
        console.error(`Erro ao deletar agendamento ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: 'Agendamento não encontrado para exclusão.' });
            return;
        }
        next(error); // Pass other errors to error handler
    }
});
exports.deleteAppointment = deleteAppointment;
