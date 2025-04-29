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
const client_1 = require("@prisma/client"); // Revertido: Importar de @prisma/client
// Função auxiliar para tratamento de erros
const handleError = (res, error, message) => {
    console.error(message, error);
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        // Erros específicos do Prisma
        if (error.code === 'P2003') {
            return res.status(400).json({ message: 'Um ou mais IDs fornecidos (usuário, serviço ou profissional) são inválidos.' });
        }
        if (error.code === 'P2025') {
            // Este erro geralmente indica que o registro não foi encontrado para update/delete
            // A lógica do repositório já retorna null, então o controlador trata isso
            // Mas podemos logar especificamente se quisermos
            console.error("Prisma Error P2025: Record not found.");
            // Não retornamos aqui, pois o controlador já trata o null
        }
        // Adicionar outros códigos de erro do Prisma conforme necessário
    }
    // Erro genérico
    return res.status(500).json({ message: 'Erro interno do servidor' });
};
// Obter todos os agendamentos (com filtros opcionais)
const getAllAppointments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, professionalId, status } = req.query;
    try {
        let appointments;
        if (userId) {
            appointments = yield appointmentRepository_1.appointmentRepository.findByUser(userId, status);
        }
        else if (professionalId) {
            appointments = yield appointmentRepository_1.appointmentRepository.findByProfessional(professionalId);
        }
        else {
            return res.status(400).json({ message: 'É necessário fornecer userId ou professionalId para filtrar os agendamentos' });
        }
        return res.json(appointments);
    }
    catch (error) {
        return handleError(res, error, 'Erro ao buscar agendamentos:');
    }
});
exports.getAllAppointments = getAllAppointments;
// Obter um agendamento específico pelo ID
const getAppointmentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const appointment = yield appointmentRepository_1.appointmentRepository.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Agendamento não encontrado' });
        }
        return res.json(appointment);
    }
    catch (error) {
        return handleError(res, error, `Erro ao buscar agendamento ${id}:`);
    }
});
exports.getAppointmentById = getAppointmentById;
// Criar um novo agendamento
const createAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = req.body;
    if (!data.date || !data.userId || !data.serviceId || !data.professionalId) {
        return res.status(400).json({
            message: 'Data, ID do usuário, ID do serviço e ID do profissional são obrigatórios'
        });
    }
    try {
        const appointmentDate = new Date(data.date);
        if (appointmentDate < new Date()) {
            return res.status(400).json({ message: 'A data do agendamento deve ser futura' });
        }
        const newAppointment = yield appointmentRepository_1.appointmentRepository.create(data);
        return res.status(201).json(newAppointment);
    }
    catch (error) {
        return handleError(res, error, 'Erro ao criar agendamento:');
    }
});
exports.createAppointment = createAppointment;
// Atualizar o status de um agendamento
const updateAppointmentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !Object.values(client_1.AppointmentStatus).includes(status)) {
        return res.status(400).json({
            message: 'Status inválido. Valores permitidos: ' + Object.values(client_1.AppointmentStatus).join(', ')
        });
    }
    try {
        const updatedAppointment = yield appointmentRepository_1.appointmentRepository.updateStatus(id, status);
        if (!updatedAppointment) {
            return res.status(404).json({ message: 'Agendamento não encontrado para atualização' });
        }
        return res.json(updatedAppointment);
    }
    catch (error) {
        return handleError(res, error, `Erro ao atualizar status do agendamento ${id}:`);
    }
});
exports.updateAppointmentStatus = updateAppointmentStatus;
// Cancelar um agendamento (caso especial de atualização de status)
const cancelAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const updatedAppointment = yield appointmentRepository_1.appointmentRepository.updateStatus(id, client_1.AppointmentStatus.CANCELLED);
        if (!updatedAppointment) {
            return res.status(404).json({ message: 'Agendamento não encontrado para cancelamento' });
        }
        return res.json({
            message: 'Agendamento cancelado com sucesso',
            appointment: updatedAppointment
        });
    }
    catch (error) {
        return handleError(res, error, `Erro ao cancelar agendamento ${id}:`);
    }
});
exports.cancelAppointment = cancelAppointment;
// Deletar um agendamento (geralmente não recomendado, preferir cancelamento)
const deleteAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const deletedAppointment = yield appointmentRepository_1.appointmentRepository.delete(id);
        if (!deletedAppointment) {
            return res.status(404).json({ message: 'Agendamento não encontrado para exclusão' });
        }
        return res.status(200).json({
            message: 'Agendamento excluído com sucesso',
            appointment: deletedAppointment
        });
    }
    catch (error) {
        // O repositório já trata P2025 retornando null
        return handleError(res, error, `Erro ao deletar agendamento ${id}:`);
    }
});
exports.deleteAppointment = deleteAppointment;
