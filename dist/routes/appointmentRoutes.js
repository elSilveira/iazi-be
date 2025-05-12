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
const validationMiddleware_1 = require("../middlewares/validationMiddleware"); // Corrected import
const authMiddleware_1 = require("../middlewares/authMiddleware"); // Corrected: Use authMiddleware
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler")); // Importar asyncHandler
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Gerenciamento de agendamentos
 */
// ... (Swagger definitions remain the same) ...
// --- Rota Pública para Disponibilidade ---
router.get("/availability", appointmentValidators_1.getAvailabilityValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)(require("../controllers/appointmentController").getAvailability));
// --- Rotas Protegidas --- 
router.use((0, asyncHandler_1.default)(authMiddleware_1.authMiddleware)); // Corrected: Use authMiddleware wrapped with asyncHandler
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
router.get("/:id", appointmentValidators_1.appointmentIdValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)(appointmentController_1.getAppointmentById)); // Corrected: Use validateRequest
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
 *         description: 'Erro de validação nos dados da requisição (ex: horário indisponível, dados inválidos).'
 *       401:
 *         description: Não autorizado.
 *       404:
 *         description: Serviço, Profissional ou Empresa não encontrado(s).
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/", appointmentValidators_1.createAppointmentValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)(appointmentController_1.createAppointment)); // Corrected: Use validateRequest
/**
 * @swagger
 * /api/appointments/{id}/status:
 *   patch:
 *     summary: 'Atualiza o status de um agendamento (ex: confirmar, completar)'
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
router.patch("/:id/status", appointmentValidators_1.updateAppointmentValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)(appointmentController_1.updateAppointmentStatus)); // Corrected: Use validateRequest
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
 *         description: 'ID inválido ou agendamento não pode ser cancelado (ex: já passou).'
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
// router.delete("/:id", appointmentIdValidator, validateRequest, asyncHandler(deleteAppointment)); // Comentado pois a função não está exportada
exports.default = router;
