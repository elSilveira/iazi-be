import { Router } from "express";
import {
  getAllProfessionalsHandler,
  getProfessionalByIdHandler,
  createProfessionalHandler,
  updateProfessionalHandler,
  deleteProfessionalHandler,
  addServiceToProfessionalHandler,
  removeServiceFromProfessionalHandler,
  checkAdminOrCompanyOwnerMiddleware // Import middleware
} from "../controllers/professionalController";
import { 
  createProfessionalValidator, 
  updateProfessionalValidator, 
  professionalIdValidator,
  professionalServiceAssociationValidator
} from "../validators/professionalValidators";
import { serviceIdValidator } from "../validators/serviceValidators";
import { validateRequest } from "../middlewares/validationMiddleware";
import asyncHandler from "../utils/asyncHandler"; // Corrected import

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Professionals
 *   description: Gerenciamento de profissionais
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProfessionalCreateInput:
 *       type: object
 *       properties:
 *         name: { type: string, description: 'Nome do profissional (opcional, pode vir do usuário associado)' }
 *         role: { type: string, description: 'Cargo do profissional (opcional)' }
 *         companyId: { type: string, format: uuid, description: 'ID da empresa à qual o profissional pertence (opcional)' }
 *         image: { type: string, format: url, description: 'URL da imagem do profissional (opcional)' }
 *         bio: { type: string, description: 'Biografia do profissional (opcional)' }
 *         phone: { type: string, description: 'Telefone do profissional (opcional)' }
 *         # userId: { type: string, format: uuid, description: 'ID do usuário a ser associado (geralmente implícito pela autenticação)' }
 *     ProfessionalUpdateInput:
 *       type: object
 *       properties:
 *         name: { type: string, description: 'Novo nome do profissional' }
 *         role: { type: string, description: 'Novo cargo do profissional' }
 *         image: { type: string, format: url, nullable: true, description: 'Nova URL da imagem do profissional' }
 *         bio: { type: string, nullable: true, description: 'Nova biografia do profissional' }
 *         phone: { type: string, nullable: true, description: 'Novo telefone do profissional' }
 *     ProfessionalServiceAssociationInput:
 *       type: object
 *       required:
 *         - serviceId
 *       properties:
 *         serviceId: { type: string, format: uuid, description: 'ID do serviço a ser associado' }
 *         price: { type: number, format: float, description: 'Preço específico para este profissional (opcional, usa preço padrão do serviço se não fornecido)' }
 *     Professional:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid, description: 'ID único do profissional' }
 *         userId: { type: string, format: uuid, description: 'ID do usuário associado' }
 *         companyId: { type: string, format: uuid, nullable: true, description: 'ID da empresa associada' }
 *         name: { type: string, description: 'Nome do profissional' }
 *         role: { type: string, nullable: true, description: 'Cargo do profissional' }
 *         image: { type: string, format: url, nullable: true, description: 'URL da imagem' }
 *         bio: { type: string, nullable: true, description: 'Biografia' }
 *         phone: { type: string, nullable: true, description: 'Telefone' }
 *         rating: { type: number, format: float, nullable: true, description: 'Avaliação média do profissional' }
 *         totalReviews: { type: integer, nullable: true, description: 'Número total de avaliações' }
 *         createdAt: { type: string, format: date-time, description: 'Data de criação' }
 *         updatedAt: { type: string, format: date-time, description: 'Data da última atualização' }
 *         # Adicionar user, company, services, appointments se forem incluídos na resposta
 *     ProfessionalListResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items: { $ref: '#/components/schemas/Professional' }
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage: { type: integer }
 *             totalPages: { type: integer }
 *             totalItems: { type: integer }
 *             itemsPerPage: { type: integer }
 */

/**
 * @swagger
 * /api/professionals:
 *   get:
 *     summary: Lista todos os profissionais com filtros e paginação
 *     tags: [Professionals]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Termo de busca (nome, cargo, bio)
 *       - in: query
 *         name: companyId
 *         schema: { type: string, format: uuid }
 *         description: Filtrar por ID da empresa
 *       - in: query
 *         name: serviceId
 *         schema: { type: string, format: uuid }
 *         description: Filtrar por profissionais que oferecem um serviço específico
 *       - in: query
 *         name: minRating
 *         schema: { type: number, format: float }
 *         description: Filtrar por avaliação mínima
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [rating_desc, name_asc] }
 *         description: Critério de ordenação
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
 *         description: Lista de profissionais retornada com sucesso.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ProfessionalListResponse' }
 *       400:
 *         description: Parâmetros de paginação ou filtro inválidos.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/", asyncHandler(getAllProfessionalsHandler));

/**
 * @swagger
 * /api/professionals/{id}:
 *   get:
 *     summary: Obtém um profissional específico pelo ID
 *     tags: [Professionals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID do profissional
 *     responses:
 *       200:
 *         description: Detalhes do profissional retornados com sucesso.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Professional' }
 *       400:
 *         description: ID inválido.
 *       404:
 *         description: Profissional não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get(
  "/:id", 
  professionalIdValidator[0], // Pass the single middleware function directly
  validateRequest, 
  asyncHandler(getProfessionalByIdHandler)
);

/**
 * @swagger
 * /api/professionals:
 *   post:
 *     summary: Cria um novo perfil profissional (Requer Admin ou Dono da Empresa)
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProfessionalCreateInput' }
 *     responses:
 *       201:
 *         description: Profissional criado com sucesso.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Professional' }
 *       400:
 *         description: Erro de validação nos dados da requisição.
 *       401:
 *         description: Não autorizado (token inválido ou ausente).
 *       403:
 *         description: Acesso negado (usuário não é Admin ou Dono da Empresa associada).
 *       500:
 *         description: Erro interno do servidor.
 */
router.post(
  "/", 
  checkAdminOrCompanyOwnerMiddleware, // Apply auth middleware
  ...createProfessionalValidator, // Spread validation middlewares
  validateRequest, 
  asyncHandler(createProfessionalHandler)
);

/**
 * @swagger
 * /api/professionals/{id}:
 *   put:
 *     summary: Atualiza um profissional existente (Requer Admin ou Dono da Empresa)
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID do profissional a ser atualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProfessionalUpdateInput' }
 *     responses:
 *       200:
 *         description: Profissional atualizado com sucesso.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Professional' }
 *       400:
 *         description: Erro de validação nos dados da requisição ou ID inválido.
 *       401:
 *         description: Não autorizado (token inválido ou ausente).
 *       403:
 *         description: Acesso negado (usuário não é Admin ou Dono da Empresa associada).
 *       404:
 *         description: Profissional não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.put(
  "/:id", 
  checkAdminOrCompanyOwnerMiddleware, // Apply auth middleware
  ...updateProfessionalValidator, // Spread validation middlewares
  validateRequest, 
  asyncHandler(updateProfessionalHandler)
);

/**
 * @swagger
 * /api/professionals/{id}:
 *   delete:
 *     summary: Deleta um profissional (Requer Admin ou Dono da Empresa)
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID do profissional a ser deletado
 *     responses:
 *       200:
 *         description: Profissional deletado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: 'Profissional excluído com sucesso' }
 *                 professional: { $ref: '#/components/schemas/Professional' } # Retorna o profissional deletado
 *       400:
 *         description: ID inválido.
 *       401:
 *         description: Não autorizado (token inválido ou ausente).
 *       403:
 *         description: Acesso negado (usuário não é Admin ou Dono da Empresa associada).
 *       404:
 *         description: Profissional não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.delete(
  "/:id", 
  checkAdminOrCompanyOwnerMiddleware, // Apply auth middleware
  professionalIdValidator[0], // Pass the single middleware function directly
  validateRequest, 
  asyncHandler(deleteProfessionalHandler)
);

/**
 * @swagger
 * /api/professionals/{professionalId}/services:
 *   post:
 *     summary: Associa um serviço a um profissional (Requer Admin ou Dono da Empresa)
 *     tags: [Professionals, Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: professionalId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID do profissional
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProfessionalServiceAssociationInput' }
 *     responses:
 *       201:
 *         description: Serviço associado com sucesso.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Professional' } # Ou um schema específico de associação
 *       400:
 *         description: Erro de validação (IDs inválidos, serviço já associado, etc.).
 *       401:
 *         description: Não autorizado.
 *       403:
 *         description: Acesso negado.
 *       404:
 *         description: Profissional ou Serviço não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post(
  "/:professionalId/services", 
  checkAdminOrCompanyOwnerMiddleware, // Apply auth middleware (checks based on professionalId)
  ...professionalServiceAssociationValidator, // Spread validation middlewares
  validateRequest, 
  asyncHandler(addServiceToProfessionalHandler)
);

/**
 * @swagger
 * /api/professionals/{professionalId}/services/{serviceId}:
 *   delete:
 *     summary: Desassocia um serviço de um profissional (Requer Admin ou Dono da Empresa)
 *     tags: [Professionals, Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: professionalId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID do profissional
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID do serviço a ser desassociado
 *     responses:
 *       200:
 *         description: Serviço desassociado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: 'Serviço desassociado com sucesso' }
 *       400:
 *         description: IDs inválidos.
 *       401:
 *         description: Não autorizado.
 *       403:
 *         description: Acesso negado.
 *       404:
 *         description: Profissional, Serviço ou Associação não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.delete(
  "/:professionalId/services/:serviceId", 
  checkAdminOrCompanyOwnerMiddleware, // Apply auth middleware (checks based on professionalId)
  professionalIdValidator[0], // Pass the single middleware function directly
  serviceIdValidator[0],      // Pass the single middleware function directly
  validateRequest, 
  asyncHandler(removeServiceFromProfessionalHandler)
);

export default router;

