"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const companyController_1 = require("../controllers/companyController");
const companyValidators_1 = require("../validators/companyValidators");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
// TODO: Adicionar middleware de autenticação/autorização para rotas protegidas
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: Obtém uma lista de todas as empresas
 *     tags: [Companies]
 *     # security:
 *     #   - bearerAuth: [] # Descomente se a autenticação for necessária
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtra empresas por categoria
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filtra empresas por cidade
 *       # Adicionar outros parâmetros de filtro/paginação se necessário
 *     responses:
 *       200:
 *         description: Lista de empresas retornada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Company'
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/", companyController_1.getAllCompanies);
/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: Obtém detalhes de uma empresa específica pelo ID
 *     tags: [Companies]
 *     # security:
 *     #   - bearerAuth: [] # Descomente se a autenticação for necessária
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da empresa a ser obtida
 *     responses:
 *       200:
 *         description: Detalhes da empresa retornados com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       400:
 *         description: ID inválido fornecido.
 *       404:
 *         description: Empresa não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/:id", companyValidators_1.companyIdValidator, validationMiddleware_1.validateRequest, companyController_1.getCompanyById);
/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: Cria uma nova empresa
 *     tags: [Companies]
 *     # security:
 *     #   - bearerAuth: [] # Requer autenticação para criar empresa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCompanyInput'
 *     responses:
 *       201:
 *         description: Empresa criada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       400:
 *         description: Erro de validação nos dados fornecidos.
 *       401:
 *         description: Não autorizado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/", companyValidators_1.createCompanyValidator, validationMiddleware_1.validateRequest, companyController_1.createCompany);
/**
 * @swagger
 * /api/companies/{id}:
 *   put:
 *     summary: Atualiza uma empresa existente pelo ID
 *     tags: [Companies]
 *     # security:
 *     #   - bearerAuth: [] # Requer autenticação para atualizar empresa
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da empresa a ser atualizada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             # Definir um schema específico para atualização ou usar um parcial de Company
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               email: { type: string, format: email, nullable: true }
 *               phone: { type: string, nullable: true }
 *               categories: { type: array, items: { type: string } }
 *               yearEstablished: { type: string, nullable: true }
 *               address: { $ref: '#/components/schemas/CreateAddressInput', nullable: true }
 *               # Adicionar outros campos atualizáveis
 *     responses:
 *       200:
 *         description: Empresa atualizada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       400:
 *         description: Erro de validação ou ID inválido.
 *       401:
 *         description: Não autorizado.
 *       404:
 *         description: Empresa não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.put("/:id", companyValidators_1.updateCompanyValidator, validationMiddleware_1.validateRequest, companyController_1.updateCompany);
/**
 * @swagger
 * /api/companies/{id}:
 *   delete:
 *     summary: Deleta uma empresa existente pelo ID
 *     tags: [Companies]
 *     # security:
 *     #   - bearerAuth: [] # Requer autenticação/autorização para deletar empresa
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da empresa a ser deletada
 *     responses:
 *       204:
 *         description: Empresa deletada com sucesso (sem conteúdo).
 *       400:
 *         description: ID inválido fornecido.
 *       401:
 *         description: Não autorizado.
 *       404:
 *         description: Empresa não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.delete("/:id", companyValidators_1.companyIdValidator, validationMiddleware_1.validateRequest, companyController_1.deleteCompany);
exports.default = router;
