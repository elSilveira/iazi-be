"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController"); // Added getUserFeed
const authMiddleware_1 = require("../middlewares/authMiddleware");
const userValidators_1 = require("../validators/userValidators");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const router = (0, express_1.Router)();
// Apply auth middleware to all user routes
router.use(authMiddleware_1.authMiddleware);
/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Obtém o perfil do usuário autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do usuário retornado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User' # Referencia o schema User definido em swagger.ts
 *       401:
 *         description: Não autorizado (token inválido ou ausente).
 *       404:
 *         description: Usuário não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/me", userController_1.getUserProfile);
/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Atualiza o perfil do usuário autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Novo nome do usuário.
 *                 example: "Nome Atualizado"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Novo email do usuário.
 *                 example: "novo.email@example.com"
 *               phone:
 *                 type: string
 *                 description: Novo telefone do usuário.
 *                 example: "99999-8888"
 *               bio:
 *                 type: string
 *                 description: Nova biografia do usuário.
 *                 example: "Desenvolvedor apaixonado por tecnologia."
 *               avatar:
 *                 type: string
 *                 format: url
 *                 description: Nova URL do avatar do usuário.
 *                 example: "https://example.com/new-avatar.jpg"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Nova senha do usuário (opcional).
 *                 example: "newSecurePassword123"
 *             # Adicione outros campos atualizáveis conforme necessário
 *     responses:
 *       200:
 *         description: Perfil do usuário atualizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Perfil atualizado com sucesso."
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos na requisição (erro de validação).
 *       401:
 *         description: Não autorizado.
 *       409:
 *         description: Conflito (ex: email já em uso).
 *       500:
 *         description: Erro interno do servidor ao atualizar.
 */
router.put("/me", userValidators_1.updateUserValidator, validationMiddleware_1.validateRequest, userController_1.updateUserProfile);
/**
 * @swagger
 * /api/users/me/feed:
 *   get:
 *     summary: Obtém o feed de atividades do usuário autenticado
 *     tags: [Users, Feed]
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
 *         description: Feed de atividades retornado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ActivityLog' # Referencia o schema ActivityLog
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                     totalItems:
 *                       type: integer
 *                       example: 53
 *                     totalPages:
 *                       type: integer
 *                       example: 6
 *       400:
 *         description: Parâmetros de paginação inválidos.
 *       401:
 *         description: Não autorizado (token inválido ou ausente).
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/me/feed", userController_1.getUserFeed); // Added route for user feed
exports.default = router;
