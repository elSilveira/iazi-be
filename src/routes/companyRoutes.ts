import { Router } from "express";
import {
  getAllCompaniesHandler as getAllCompanies,
  getCompanyByIdHandler as getCompanyById,
  createCompanyHandler as createCompany,
  updateCompanyHandler as updateCompany,
  deleteCompanyHandler as deleteCompany,
  checkAdminRoleMiddleware // Import middleware
} from "../controllers/companyController";
import { 
  createCompanyValidator, 
  updateCompanyValidator, 
  companyIdValidator 
} from "../validators/companyValidators";

import asyncHandler from "../utils/asyncHandler"; // Corrected import

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Gerenciamento de empresas
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CompanyAddressInput:
 *       type: object
 *       required:
 *         - street
 *         - number
 *         - neighborhood
 *         - city
 *         - state
 *         - zipCode
 *       properties:
 *         street: { type: string, description: 'Rua do endereço' }
 *         number: { type: string, description: 'Número do endereço' }
 *         neighborhood: { type: string, description: 'Bairro do endereço' }
 *         city: { type: string, description: 'Cidade do endereço' }
 *         state: { type: string, description: 'Estado (UF, 2 caracteres)', minLength: 2, maxLength: 2 }
 *         zipCode: { type: string, description: 'CEP (formato brasileiro)', pattern: '^\\d{5}-\\d{3}$' }
 *         complement: { type: string, description: 'Complemento (opcional)' }
 *     CompanyWorkingHoursInput: # Placeholder - Assuming JSON string for now
 *       type: string 
 *       format: json
 *       description: 'Horários de funcionamento em formato JSON (estrutura a definir)'
 *       example: '{"monday": {"open": "08:00", "close": "18:00", "isOpen": true}}'
 *     CompanyCreateInput:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - categories
 *         - address
 *       properties:
 *         name: { type: string, description: 'Nome da empresa' }
 *         description: { type: string, description: 'Descrição da empresa' }
 *         logo: { type: string, format: url, description: 'URL do logo (opcional)' }
 *         coverImage: { type: string, format: url, description: 'URL da imagem de capa (opcional)' }
 *         yearEstablished: { type: integer, description: 'Ano de estabelecimento (opcional)' }
 *         phone: { type: string, description: 'Telefone (formato brasileiro, opcional)' }
 *         email: { type: string, format: email, description: 'Email da empresa (opcional)' }
 *         categories: { type: array, items: { type: string }, description: 'Lista de categorias (pelo menos uma)' }
 *         address: { $ref: '#/components/schemas/CompanyAddressInput' }
 *         workingHours: { $ref: '#/components/schemas/CompanyWorkingHoursInput' }
 *     CompanyUpdateInput:
 *       type: object
 *       properties:
 *         name: { type: string, description: 'Nome da empresa' }
 *         description: { type: string, description: 'Descrição da empresa' }
 *         logo: { type: string, format: url, nullable: true, description: 'URL do logo' }
 *         coverImage: { type: string, format: url, nullable: true, description: 'URL da imagem de capa' }
 *         yearEstablished: { type: integer, nullable: true, description: 'Ano de estabelecimento' }
 *         phone: { type: string, nullable: true, description: 'Telefone (formato brasileiro)' }
 *         email: { type: string, format: email, nullable: true, description: 'Email da empresa' }
 *         categories: { type: array, items: { type: string }, description: 'Lista de categorias' }
 *         address: { $ref: '#/components/schemas/CompanyAddressInput' } # Assume full address update for simplicity, or define partial
 *         workingHours: { $ref: '#/components/schemas/CompanyWorkingHoursInput' }
 *     Company:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid, description: 'ID único da empresa' }
 *         name: { type: string, description: 'Nome da empresa' }
 *         description: { type: string, description: 'Descrição da empresa' }
 *         logo: { type: string, format: url, nullable: true, description: 'URL do logo' }
 *         coverImage: { type: string, format: url, nullable: true, description: 'URL da imagem de capa' }
 *         yearEstablished: { type: integer, nullable: true, description: 'Ano de estabelecimento' }
 *         phone: { type: string, nullable: true, description: 'Telefone' }
 *         email: { type: string, format: email, nullable: true, description: 'Email da empresa' }
 *         rating: { type: number, format: float, nullable: true, description: 'Avaliação média da empresa' }
 *         totalReviews: { type: integer, nullable: true, description: 'Número total de avaliações' }
 *         categories: { type: array, items: { type: string }, description: 'Lista de categorias' }
 *         address: { $ref: '#/components/schemas/CompanyAddress' } # Assuming a CompanyAddress schema exists
 *         workingHours: { type: object, nullable: true, description: 'Horários de funcionamento (estrutura a definir)' } # Assuming JSON object
 *         createdAt: { type: string, format: date-time, description: 'Data de criação' }
 *         updatedAt: { type: string, format: date-time, description: 'Data da última atualização' }
 *     CompanyAddress: # Define based on Prisma schema
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         street: { type: string }
 *         number: { type: string }
 *         neighborhood: { type: string }
 *         city: { type: string }
 *         state: { type: string }
 *         zipCode: { type: string }
 *         complement: { type: string, nullable: true }
 *         companyId: { type: string, format: uuid }
 *     CompanyListResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items: { $ref: '#/components/schemas/Company' }
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage: { type: integer }
 *             totalPages: { type: integer }
 *             totalItems: { type: integer }
 *             itemsPerPage: { type: integer }
 *   securitySchemes:
 *     bearerAuth: # arbitrary name for the security scheme
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT # optional, arbitrary value for documentation purposes
 */

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
router.get("/", asyncHandler(getAllCompanies));

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
router.get(
  "/:id", 
  companyIdValidator[0], // Pass the single middleware function directly
  validateRequest, 
  asyncHandler(getCompanyById)
);

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
router.post(
  "/", 
  checkAdminRoleMiddleware, // Apply auth middleware
  ...createCompanyValidator, // Spread validation middlewares
  validateRequest, 
  asyncHandler(createCompany)
);

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
router.put(
  "/:id", 
  checkAdminRoleMiddleware, // Apply auth middleware
  ...updateCompanyValidator, // Spread validation middlewares
  validateRequest, 
  asyncHandler(updateCompany)
);

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
router.delete(
  "/:id", 
  checkAdminRoleMiddleware, // Apply auth middleware
  companyIdValidator[0], // Pass the single middleware function directly
  validateRequest, 
  asyncHandler(deleteCompany)
);

export default router;

