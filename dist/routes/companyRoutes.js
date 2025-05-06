"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const companyController_1 = require("../controllers/companyController");
const companyValidators_1 = require("../validators/companyValidators");
const validationMiddleware_1 = require("../middlewares/validationMiddleware"); // Corrected import
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler")); // Corrected import
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Gerenciamento de empresas
 */
// ... (Swagger definitions remain the same) ...
/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: Lista todas as empresas com filtros e paginação
 *     tags: [Companies]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Termo de busca (nome, descrição, categoria, cidade, estado)
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Filtrar por categoria específica
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *         description: Filtrar por cidade
 *       - in: query
 *         name: state
 *         schema: { type: string }
 *         description: Filtrar por estado (UF)
 *       - in: query
 *         name: minRating
 *         schema: { type: number, format: float }
 *         description: Filtrar por avaliação mínima
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [rating_desc, name_asc] }
 *         description: Critério de ordenação (rating_desc, name_asc)
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
 *         description: Lista de empresas retornada com sucesso.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CompanyListResponse' }
 *       400:
 *         description: Parâmetros de paginação inválidos.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/", (0, asyncHandler_1.default)(companyController_1.getAllCompaniesHandler));
/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: Obtém uma empresa específica pelo ID
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID da empresa
 *     responses:
 *       200:
 *         description: Detalhes da empresa retornados com sucesso.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Company' }
 *       400:
 *         description: ID inválido.
 *       404:
 *         description: Empresa não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/:id", companyValidators_1.companyIdValidator[0], // Pass the single middleware function directly
validationMiddleware_1.validateRequest, // Corrected
(0, asyncHandler_1.default)(companyController_1.getCompanyByIdHandler));
/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: Cria uma nova empresa (Requer Admin)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CompanyCreateInput' }
 *     responses:
 *       201:
 *         description: Empresa criada com sucesso.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Company' }
 *       400:
 *         description: Erro de validação nos dados da requisição.
 *       401:
 *         description: Não autorizado (token inválido ou ausente).
 *       403:
 *         description: Acesso negado (usuário não é Admin).
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/", companyController_1.checkAdminRoleMiddleware, // Apply auth middleware
...companyValidators_1.createCompanyValidator, // Spread validation middlewares
validationMiddleware_1.validateRequest, // Corrected
(0, asyncHandler_1.default)(companyController_1.createCompanyHandler));
/**
 * @swagger
 * /api/companies/{id}:
 *   put:
 *     summary: Atualiza uma empresa existente (Requer Admin)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID da empresa a ser atualizada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CompanyUpdateInput' }
 *     responses:
 *       200:
 *         description: Empresa atualizada com sucesso.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Company' }
 *       400:
 *         description: Erro de validação nos dados da requisição ou ID inválido.
 *       401:
 *         description: Não autorizado (token inválido ou ausente).
 *       403:
 *         description: Acesso negado (usuário não é Admin).
 *       404:
 *         description: Empresa não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.put("/:id", companyController_1.checkAdminRoleMiddleware, // Apply auth middleware
...companyValidators_1.updateCompanyValidator, // Spread validation middlewares
validationMiddleware_1.validateRequest, // Corrected
(0, asyncHandler_1.default)(companyController_1.updateCompanyHandler));
/**
 * @swagger
 * /api/companies/{id}:
 *   delete:
 *     summary: Deleta uma empresa (Requer Admin)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID da empresa a ser deletada
 *     responses:
 *       200:
 *         description: Empresa deletada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: 'Empresa excluída com sucesso' }
 *                 company: { $ref: '#/components/schemas/Company' } # Retorna a empresa deletada
 *       400:
 *         description: ID inválido.
 *       401:
 *         description: Não autorizado (token inválido ou ausente).
 *       403:
 *         description: Acesso negado (usuário não é Admin).
 *       404:
 *         description: Empresa não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.delete("/:id", companyController_1.checkAdminRoleMiddleware, // Apply auth middleware
companyValidators_1.companyIdValidator[0], // Pass the single middleware function directly
validationMiddleware_1.validateRequest, // Corrected
(0, asyncHandler_1.default)(companyController_1.deleteCompanyHandler));
exports.default = router;
