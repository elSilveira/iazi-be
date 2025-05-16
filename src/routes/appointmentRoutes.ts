import { Router, Request, Response, NextFunction } from "express"; // Import Request, Response, NextFunction
import {
  // getAllAppointments, // Renomeado ou não exportado? Usar listAppointments
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  // cancelAppointment, // Usar updateAppointmentStatus com status CANCELLED
  // deleteAppointment, // Função de delete não implementada/exportada
  // getAppointmentAvailability // Função de disponibilidade não implementada/exportada?
  listAppointments, // Assumindo que esta é a função correta para listar
  // Adicionar outras funções exportadas do controller se necessário
} from "../controllers/appointmentController";
import { 
  createAppointmentValidator, 
  updateAppointmentValidator, 
  appointmentIdValidator,
  getAvailabilityValidator // Importar novo validator
} from "../validators/appointmentValidators";
import { validateRequest } from "../middlewares/validationMiddleware"; // Corrected import
import { authMiddleware } from "../middlewares/authMiddleware"; // Corrected: Use authMiddleware
import asyncHandler from "../utils/asyncHandler"; // Importar asyncHandler

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Gerenciamento de agendamentos
 */

// ... (Swagger definitions remain the same) ...

// --- Rota Pública para Disponibilidade ---
router.get("/availability", getAvailabilityValidator, validateRequest, asyncHandler(require("../controllers/appointmentController").getAvailability));

// --- Rotas Protegidas --- 
router.use(asyncHandler(authMiddleware)); // Corrected: Use authMiddleware wrapped with asyncHandler

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
router.get("/", asyncHandler(listAppointments)); // Usar asyncHandler

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Obtém um agendamento específico pelo ID ou a agenda pessoal do usuário
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: 
 *           oneOf:
 *             - type: string
 *               format: uuid
 *             - type: string
 *               enum: ['me']
 *         description: ID do agendamento ou 'me' para obter a agenda pessoal do usuário (foco no usuário com informações simplificadas de serviços e profissionais) *     responses:
 *       200:
 *         description: Detalhes do agendamento ou agenda pessoal do usuário retornados com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Appointment'
 *                 - $ref: '#/components/schemas/UserScheduleResponse'
 *                 
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
router.get("/:id", appointmentIdValidator, validateRequest, asyncHandler(getAppointmentById)); // Corrected: Use validateRequest

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
router.post("/", createAppointmentValidator, validateRequest, asyncHandler(createAppointment)); // Corrected: Use validateRequest

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
router.patch("/:id/status", updateAppointmentValidator, validateRequest, asyncHandler(updateAppointmentStatus)); // Corrected: Use validateRequest

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
router.patch("/:id/cancel", appointmentIdValidator, validateRequest, asyncHandler(async (req: Request, res: Response, next: NextFunction) => { // Corrected: Use validateRequest
    // Wrapper para chamar updateAppointmentStatus com status CANCELLED
    req.body.status = 'CANCELLED'; // Forçar o status
    // TODO: Adicionar validação específica para cancelamento se necessário
    // (ex: verificar permissões, prazo mínimo)
    // Chamar diretamente a função do controller, já que está envolvida por asyncHandler
    await updateAppointmentStatus(req, res, next); 
}));

// TODO: Implementar e documentar a rota DELETE se necessário
// router.delete("/:id", appointmentIdValidator, validateRequest, asyncHandler(deleteAppointment)); // Comentado pois a função não está exportada

export default router;

