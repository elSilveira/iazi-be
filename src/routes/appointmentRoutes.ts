import { Router } from "express";
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  deleteAppointment
} from "../controllers/appointmentController";
import { 
  createAppointmentValidator, 
  updateAppointmentValidator, 
  appointmentIdValidator 
} from "../validators/appointmentValidators";
import { validateRequest } from "../middlewares/validationMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware"; // Importar o middleware de autenticação

const router = Router();

// Aplicar middleware de autenticação a todas as rotas de agendamento
router.use(authMiddleware);

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Obtém os agendamentos do usuário autenticado
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: professionalId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtra agendamentos por ID do profissional (opcional)
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtra agendamentos por data (YYYY-MM-DD) (opcional)
 *       # Adicionar outros filtros como status, etc.
 *     responses:
 *       200:
 *         description: Lista de agendamentos retornada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 *       401:
 *         description: Não autorizado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/", getAllAppointments);

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Obtém detalhes de um agendamento específico pelo ID
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do agendamento a ser obtido
 *     responses:
 *       200:
 *         description: Detalhes do agendamento retornados com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: ID inválido fornecido.
 *       401:
 *         description: Não autorizado (usuário não é dono do agendamento?).
 *       404:
 *         description: Agendamento não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/:id", appointmentIdValidator, validateRequest, getAppointmentById);

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
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - serviceId
 *               - professionalId # Tornar obrigatório ou opcional dependendo da regra
 *             properties:
 *               date: { type: string, format: date-time, description: 'Data e hora do agendamento (ISO 8601)' }
 *               serviceId: { type: string, format: uuid, description: 'ID do serviço agendado' }
 *               professionalId: { type: string, format: uuid, description: 'ID do profissional responsável' }
 *               notes: { type: string, nullable: true, description: 'Observações adicionais' }
 *     responses:
 *       201:
 *         description: Agendamento criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Erro de validação (data inválida, IDs inválidos, horário indisponível, etc.).
 *       401:
 *         description: Não autorizado.
 *       404:
 *         description: Serviço ou Profissional não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/", createAppointmentValidator, validateRequest, createAppointment);

/**
 * @swagger
 * /api/appointments/{id}/status:
 *   patch:
 *     summary: Atualiza o status de um agendamento (ex: CONFIRMED, COMPLETED)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: [] # Geralmente apenas profissional/admin pode mudar status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do agendamento a ser atualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status: { $ref: '#/components/schemas/AppointmentStatus' }
 *     responses:
 *       200:
 *         description: Status do agendamento atualizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Erro de validação (ID inválido, status inválido).
 *       401:
 *         description: Não autorizado.
 *       404:
 *         description: Agendamento não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.patch("/:id/status", updateAppointmentValidator, validateRequest, updateAppointmentStatus);

/**
 * @swagger
 * /api/appointments/{id}/cancel:
 *   patch:
 *     summary: Cancela um agendamento (define o status como CANCELLED)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: [] # Usuário dono ou profissional/admin podem cancelar
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do agendamento a ser cancelado
 *     responses:
 *       200:
 *         description: Agendamento cancelado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: ID inválido fornecido.
 *       401:
 *         description: Não autorizado.
 *       404:
 *         description: Agendamento não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.patch("/:id/cancel", appointmentIdValidator, validateRequest, cancelAppointment);

// /**
//  * @swagger
//  * /api/appointments/{id}:
//  *   delete:
//  *     summary: Deleta um agendamento existente pelo ID (se permitido)
//  *     tags: [Appointments]
//  *     security:
//  *       - bearerAuth: [] # Requer autenticação/autorização
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *           format: uuid
//  *         description: ID do agendamento a ser deletado
//  *     responses:
//  *       204:
//  *         description: Agendamento deletado com sucesso (sem conteúdo).
//  *       400:
//  *         description: ID inválido fornecido.
//  *       401:
//  *         description: Não autorizado.
//  *       404:
//  *         description: Agendamento não encontrado.
//  *       500:
//  *         description: Erro interno do servidor.
//  */
// router.delete("/:id", appointmentIdValidator, validateRequest, deleteAppointment);

export default router;

