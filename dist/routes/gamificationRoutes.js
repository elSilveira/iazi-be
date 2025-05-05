"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gamificationController_1 = require("../controllers/gamificationController");
const authMiddleware_1 = require("../middlewares/authMiddleware"); // Corrected import path assuming it's in middlewares
const router = (0, express_1.Router)();
// Apply authentication middleware to all gamification routes
router.use(authMiddleware_1.authMiddleware);
/**
 * @swagger
 * /api/gamification/profile/me:
 *   get:
 *     summary: Obtém o perfil de gamificação do usuário autenticado
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil de gamificação retornado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId: { type: string, format: uuid }
 *                 name: { type: string }
 *                 points: { type: integer }
 *                 badges: { type: array, items: { $ref: '#/components/schemas/Badge' } }
 *       401:
 *         description: Não autorizado.
 *       404:
 *         description: Usuário não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/profile/me", gamificationController_1.getGamificationProfile); // Controller needs to get userId from req.user
/**
 * @swagger
 * /api/gamification/profile/{userId}:
 *   get:
 *     summary: Obtém o perfil de gamificação de um usuário específico (requer permissão?)
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário para obter o perfil
 *     responses:
 *       200:
 *         description: Perfil de gamificação retornado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId: { type: string, format: uuid }
 *                 name: { type: string }
 *                 points: { type: integer }
 *                 badges: { type: array, items: { $ref: '#/components/schemas/Badge' } }
 *       400:
 *         description: ID de usuário inválido.
 *       401:
 *         description: Não autorizado.
 *       403:
 *         description: Proibido (usuário não tem permissão para ver este perfil?).
 *       404:
 *         description: Usuário não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/profile/:userId", gamificationController_1.getGamificationProfile); // Controller handles userId from params
/**
 * @swagger
 * /api/gamification/leaderboard:
 *   get:
 *     summary: Obtém o ranking (leaderboard) de usuários por pontos
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número máximo de usuários a retornar no ranking
 *     responses:
 *       200:
 *         description: Ranking retornado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   rank: { type: integer }
 *                   userId: { type: string, format: uuid }
 *                   name: { type: string }
 *                   points: { type: integer }
 *                   avatar: { type: string, format: url, nullable: true }
 *       401:
 *         description: Não autorizado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/leaderboard", gamificationController_1.getLeaderboard);
exports.default = router; // Changed to default export
