"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reviewController_1 = require("../controllers/reviewController");
const reviewValidators_1 = require("../validators/reviewValidators");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const authMiddleware_1 = require("../middlewares/authMiddleware"); // Importar authMiddleware
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Obtém avaliações filtradas por serviço, profissional ou empresa
 *     tags: [Reviews]
 *     # security:
 *     #   - bearerAuth: [] # Avaliações geralmente são públicas
 *     parameters:
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtra avaliações pelo ID do serviço
 *       - in: query
 *         name: professionalId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtra avaliações pelo ID do profissional
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtra avaliações pelo ID da empresa
 *       # Adicionar paginação se necessário
 *     responses:
 *       200:
 *         description: Lista de avaliações retornada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 *       400:
 *         description: Erro de validação (nenhum filtro fornecido ou IDs inválidos).
 *       500:
 *         description: Erro interno do servidor.
 */
// Remover getReviewsValidator, pois não existe e a validação parece ser feita no controller
router.get("/", /* getReviewsValidator, */ validationMiddleware_1.validateRequest, reviewController_1.getReviews);
/**
 * @swagger
 * /api/reviews/{id}:
 *   get:
 *     summary: Obtém detalhes de uma avaliação específica pelo ID
 *     tags: [Reviews]
 *     # security:
 *     #   - bearerAuth: [] # Avaliações geralmente são públicas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da avaliação a ser obtida
 *     responses:
 *       200:
 *         description: Detalhes da avaliação retornados com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: ID inválido fornecido.
 *       404:
 *         description: Avaliação não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/:id", reviewValidators_1.reviewIdValidator, validationMiddleware_1.validateRequest, reviewController_1.getReviewById);
/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Cria uma nova avaliação
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: [] # Requer autenticação para criar avaliação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               # Pelo menos um ID de referência (serviceId, professionalId, companyId) deve ser fornecido
 *             properties:
 *               rating: { type: number, format: float, minimum: 1, maximum: 5, description: 'Nota da avaliação (1 a 5)' }
 *               comment: { type: string, nullable: true, description: 'Comentário da avaliação' }
 *               serviceId: { type: string, format: uuid, nullable: true, description: 'ID do serviço avaliado' }
 *               professionalId: { type: string, format: uuid, nullable: true, description: 'ID do profissional avaliado' }
 *               companyId: { type: string, format: uuid, nullable: true, description: 'ID da empresa avaliada' }
 *     responses:
 *       201:
 *         description: Avaliação criada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: Erro de validação (nota inválida, IDs inválidos, falta de ID de referência).
 *       401:
 *         description: Não autorizado.
 *       404:
 *         description: Serviço, Profissional ou Empresa não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/", authMiddleware_1.authMiddleware, reviewValidators_1.createReviewValidator, validationMiddleware_1.validateRequest, reviewController_1.createReview); // Adicionar authMiddleware
/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Atualiza uma avaliação existente pelo ID (apenas rating e comment)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: [] # Requer autenticação e ser o dono da avaliação
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da avaliação a ser atualizada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating: { type: number, format: float, minimum: 1, maximum: 5 }
 *               comment: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Avaliação atualizada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: Erro de validação ou ID inválido.
 *       401:
 *         description: Não autorizado (não é o dono da avaliação).
 *       404:
 *         description: Avaliação não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.put("/:id", authMiddleware_1.authMiddleware, reviewValidators_1.updateReviewValidator, validationMiddleware_1.validateRequest, reviewController_1.updateReview); // Adicionar authMiddleware
/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Deleta uma avaliação existente pelo ID
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: [] # Requer autenticação e ser o dono da avaliação ou admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da avaliação a ser deletada
 *     responses:
 *       204:
 *         description: Avaliação deletada com sucesso (sem conteúdo).
 *       400:
 *         description: ID inválido fornecido.
 *       401:
 *         description: Não autorizado.
 *       404:
 *         description: Avaliação não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.delete("/:id", authMiddleware_1.authMiddleware, reviewValidators_1.reviewIdValidator, validationMiddleware_1.validateRequest, reviewController_1.deleteReview); // Adicionar authMiddleware
exports.default = router;
