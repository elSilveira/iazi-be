import { Router } from "express";
import {
    getUserNotifications,
    markAsRead,
    markAllAsRead
} from "../controllers/notificationController";
import { authMiddleware } from "../middlewares/authMiddleware";
// import { validateRequest } from "../middlewares/validationMiddleware"; // No specific validators needed for now
// import { notificationIdValidator } from "../validators/notificationValidators"; // Validator could be added later

const router = Router();

// Apply auth middleware to all notification routes
router.use(authMiddleware);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Obtém as notificações não lidas do usuário autenticado
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página para paginação.
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de itens por página.
 *     responses:
 *       200:
 *         description: Lista de notificações não lidas retornada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification' # Referencia o schema Notification
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Parâmetros de paginação inválidos.
 *       401:
 *         description: Não autorizado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/", getUserNotifications);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Marca todas as notificações não lidas do usuário como lidas
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notificações marcadas como lidas com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "3 notificações marcadas como lidas."
 *                 count:
 *                   type: integer
 *                   example: 3
 *       401:
 *         description: Não autorizado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.patch("/read-all", markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Marca uma notificação específica como lida
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da notificação a ser marcada como lida.
 *     responses:
 *       200:
 *         description: Notificação marcada como lida com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       400:
 *         description: ID da notificação inválido.
 *       401:
 *         description: Não autorizado.
 *       403:
 *         description: Proibido (tentando marcar notificação de outro usuário).
 *       404:
 *         description: Notificação não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.patch("/:id/read", /* notificationIdValidator, validateRequest, */ markAsRead);


export default router;

