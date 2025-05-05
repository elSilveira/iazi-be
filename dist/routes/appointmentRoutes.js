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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express"); // Import Request, Response, NextFunction
const appointmentController_1 = require("../controllers/appointmentController");
const appointmentValidators_1 = require("../validators/appointmentValidators");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const authMiddleware_1 = require("../middlewares/authMiddleware"); // Importar o middleware de autenticação
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler")); // Importar asyncHandler
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Gerenciamento de agendamentos
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     AppointmentStatus:
 *       type: string
 *       enum: [PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW]
 *       description: Status do agendamento
 *     AppointmentCreateInput:
 *       type: object
 *       required:
 *         - startTime
 *         - serviceId
 *         - userId # Embora venha do token, o validator espera
 *       properties:
 *         startTime: { type: string, format: date-time, description: 'Data e hora de início do agendamento (ISO8601)' }
 *         serviceId: { type: string, format: uuid, description: 'ID do serviço agendado' }
 *         professionalId: { type: string, format: uuid, description: 'ID do profissional (opcional, pode ser inferido do serviço ou empresa)' }
 *         companyId: { type: string, format: uuid, description: 'ID da empresa (opcional, pode ser inferido do serviço)' }
 *         userId: { type: string, format: uuid, description: 'ID do usuário cliente (geralmente preenchido pelo controller a partir do token)' }
 *         notes: { type: string, nullable: true, description: 'Notas adicionais sobre o agendamento (opcional)' }
 *     AppointmentUpdateInput:
 *       type: object
 *       properties:
 *         startTime: { type: string, format: date-time, description: 'Nova data e hora de início (opcional)' }
 *         status: { $ref: '#/components/schemas/AppointmentStatus' }
 *         professionalId: { type: string, format: uuid, nullable: true, description: 'Novo ID do profissional (opcional)' }
 *         notes: { type: string, nullable: true, description: 'Novas notas adicionais (opcional)' }
 *     Appointment:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid, description: 'ID único do agendamento' }
 *         startTime: { type: string, format: date-time, description: 'Data e hora de início' }
 *         endTime: { type: string, format: date-time, nullable: true, description: 'Data e hora de término (calculada)' }
 *         status: { $ref: '#/components/schemas/AppointmentStatus' }
 *         notes: { type: string, nullable: true, description: 'Notas adicionais' }
 *         userId: { type: string, format: uuid, description: 'ID do usuário cliente' }
 *         serviceId: { type: string, format: uuid, description: 'ID do serviço agendado' }
 *         professionalId: { type: string, format: uuid, nullable: true, description: 'ID do profissional' }
 *         companyId: { type: string, format: uuid, nullable: true, description: 'ID da empresa' }
 *         createdAt: { type: string, format: date-time, description: 'Data de criação' }
 *         updatedAt: { type: string, format: date-time, description: 'Data da última atualização' }
 *         # Adicionar user, service, professional, company se forem incluídos na resposta
 *     AppointmentListResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items: { $ref: '#/components/schemas/Appointment' }
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage: { type: integer }
 *             totalPages: { type: integer }
 *             totalItems: { type: integer }
 *             itemsPerPage: { type: integer }
 */
// --- Rota Pública (ou com autenticação opcional?) para Disponibilidade ---
// TODO: Implementar e documentar a rota /availability se a função getAppointmentAvailability for exportada
// /**
//  * @swagger
//  * /api/appointments/availability:
//  *   get:
//  *     summary: Verifica horários disponíveis para agendamento
//  *     tags: [Appointments]
//  *     parameters:
//  *       - in: query
//  *         name: date
//  *         required: true
//  *         schema: { type: string, format: date, description: 'Data para verificar disponibilidade (YYYY-MM-DD)' }
//  *       - in: query
//  *         name: serviceId
//  *         schema: { type: string, format: uuid }
//  *         description: ID do serviço (opcional)
//  *       - in: query
//  *         name: professionalId
//  *         schema: { type: string, format: uuid }
//  *         description: ID do profissional (opcional)
//  *       - in: query
//  *         name: companyId
//  *         schema: { type: string, format: uuid }
//  *         description: ID da empresa (opcional)
//  *     responses:
//  *       200:
//  *         description: Lista de horários disponíveis.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 availableSlots: { type: array, items: { type: string, format: time }, example: ["09:00", "09:30", "10:00"] }
//  *       400:
//  *         description: Parâmetros inválidos.
//  *       500:
//  *         description: Erro interno do servidor.
//  */
// router.get("/availability", getAvailabilityValidator, validateRequest, asyncHandler(getAppointmentAvailability)); // Comentado pois a função não está exportada
// --- Rotas Protegidas --- 
router.use((0, asyncHandler_1.default)(authMiddleware_1.authMiddleware)); // Aplicar asyncHandler ao middleware async
/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Lista os agendamentos do usuário autenticado (ou todos para Admin)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { $ref: '#/components/schemas/AppointmentStatus' }
 *         description: Filtrar por status
 *       - in: query
 *         name: professionalId
 *         schema: { type: string, format: uuid }
 *         description: Filtrar por profissional (Admin only?)
 *       - in: query
 *         name: serviceId
 *         schema: { type: string, format: uuid }
 *         description: Filtrar por serviço
 *       - in: query
 *         name: companyId
 *         schema: { type: string, format: uuid }
 *         description: Filtrar por empresa (Admin only?)
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *         description: Filtrar por data inicial (YYYY-MM-DD)
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *         description: Filtrar por data final (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Número de itens por página
 *     responses:
 *       200:
 *         description: Lista de agendamentos retornada com sucesso.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AppointmentListResponse' }
 *       400:
 *         description: Parâmetros de filtro ou paginação inválidos.
 *       401:
 *         description: Não autorizado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/", (0, asyncHandler_1.default)(appointmentController_1.listAppointments)); // Usar asyncHandler
/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Obtém um agendamento específico pelo ID
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID do agendamento
 *     responses:
 *       200:
 *         description: Detalhes do agendamento retornados com sucesso.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Appointment' }
 *       400:
 *         description: ID inválido.
 *       401:
 *         description: Não autorizado.
 *       403:
 *         description: Acesso negado (usuário não tem permissão para ver este agendamento).
 *       404:
 *         description: Agendamento não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/:id", appointmentValidators_1.appointmentIdValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)(appointmentController_1.getAppointmentById)); // Usar asyncHandler
/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Cria um novo agendamento
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AppointmentCreateInput' }
 *     responses:
 *       201:
 *         description: Agendamento criado com sucesso.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Appointment' }
 *       400:
 *         description: Erro de validação nos dados da requisição (ex: horário indisponível, dados inválidos).
 *       401:
 *         description: Não autorizado.
 *       404:
 *         description: Serviço, Profissional ou Empresa não encontrado(s).
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/", appointmentValidators_1.createAppointmentValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)(appointmentController_1.createAppointment)); // Usar asyncHandler
/**
 * @swagger
 * /api/appointments/{id}/status:
 *   patch:
 *     summary: Atualiza o status de um agendamento (ex: confirmar, completar)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID do agendamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { $ref: '#/components/schemas/AppointmentStatus' }
 *               # Outros campos de updateAppointmentValidator podem ser incluídos aqui se necessário
 *               # startTime: { type: string, format: date-time }
 *               # professionalId: { type: string, format: uuid }
 *               # notes: { type: string }
 *     responses:
 *       200:
 *         description: Status do agendamento atualizado com sucesso.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Appointment' }
 *       400:
 *         description: Erro de validação (ID inválido, status inválido, transição de status inválida).
 *       401:
 *         description: Não autorizado.
 *       403:
 *         description: Acesso negado (usuário não tem permissão para atualizar este agendamento).
 *       404:
 *         description: Agendamento não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.patch("/:id/status", appointmentValidators_1.updateAppointmentValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)(appointmentController_1.updateAppointmentStatus)); // Usar asyncHandler
/**
 * @swagger
 * /api/appointments/{id}/cancel:
 *   patch:
 *     summary: Cancela um agendamento (atalho para atualizar status para CANCELLED)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID do agendamento a ser cancelado
 *     responses:
 *       200:
 *         description: Agendamento cancelado com sucesso.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Appointment' }
 *       400:
 *         description: ID inválido ou agendamento não pode ser cancelado (ex: já passou).
 *       401:
 *         description: Não autorizado.
 *       403:
 *         description: Acesso negado (usuário não tem permissão para cancelar este agendamento).
 *       404:
 *         description: Agendamento não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.patch("/:id/cancel", appointmentValidators_1.appointmentIdValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Wrapper para chamar updateAppointmentStatus com status CANCELLED
    req.body.status = 'CANCELLED'; // Forçar o status
    // TODO: Adicionar validação específica para cancelamento se necessário
    // (ex: verificar permissões, prazo mínimo)
    // Chamar diretamente a função do controller, já que está envolvida por asyncHandler
    yield (0, appointmentController_1.updateAppointmentStatus)(req, res, next);
})));
// TODO: Implementar e documentar a rota DELETE se necessário
// /**
//  * @swagger
//  * /api/appointments/{id}:
//  *   delete:
//  *     summary: Deleta um agendamento (Requer Admin? Ou usuário/profissional?)
//  *     tags: [Appointments]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema: { type: string, format: uuid }
//  *         description: ID do agendamento a ser deletado
//  *     responses:
//  *       200:
//  *         description: Agendamento deletado com sucesso.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message: { type: string, example: 'Agendamento excluído com sucesso' }
//  *       400:
//  *         description: ID inválido.
//  *       401:
//  *         description: Não autorizado.
//  *       403:
//  *         description: Acesso negado.
//  *       404:
//  *         description: Agendamento não encontrado.
//  *       500:
//  *         description: Erro interno do servidor.
//  */
// router.delete("/:id", appointmentIdValidator, validateRequest, asyncHandler(deleteAppointment)); // Comentado pois a função não está exportada
exports.default = router;
