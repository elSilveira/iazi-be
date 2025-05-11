import { Router } from "express";
import {
  getAllProfessionalsHandler,
  getProfessionalByIdHandler,
  createProfessionalHandler,
  updateProfessionalHandler,
  deleteProfessionalHandler,
  addServiceToProfessionalHandler,
  removeServiceFromProfessionalHandler,
  getMyProfessionalHandler
} from "../controllers/professionalController";
import { authMiddleware } from "../middlewares/authMiddleware"; // Import basic auth middleware
import { 
  createProfessionalValidator, 
  updateProfessionalValidator, 
  updateMyProfessionalValidator, // <-- add this import
  professionalIdValidator,
  professionalServiceAssociationValidator
} from "../validators/professionalValidators";
import { serviceIdValidator } from "../validators/serviceValidators";
import { validateRequest } from "../middlewares/validationMiddleware"; // Corrected import
import asyncHandler from "../utils/asyncHandler"; // Corrected import
import { checkProfessionalOwnerOrAdminMiddleware } from "../middlewares/professionalAuthMiddleware";
import { professionalRepository } from "../repositories/professionalRepository";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Professionals
 *   description: Gerenciamento de profissionais
 */

// ... (Swagger definitions remain the same) ...

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
 * /api/professionals/me:
 *   get:
 *     summary: Retorna os dados do perfil profissional do usuário autenticado
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do perfil profissional retornados com sucesso.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Professional' }
 *       401:
 *         description: Não autorizado (token inválido ou ausente).
 *       404:
 *         description: Perfil profissional não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/me", authMiddleware, asyncHandler(getMyProfessionalHandler));

/**
 * @swagger
 * /api/professionals/me:
 *   put:
 *     summary: Atualiza o perfil profissional do usuário autenticado
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfessionalUpdateInput'
 *     responses:
 *       200:
 *         description: Perfil profissional atualizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Professional'
 *       400:
 *         description: Erro de validação nos dados da requisição.
 *       401:
 *         description: Não autorizado (token inválido ou ausente).
 *       403:
 *         description: Acesso negado (usuário não é dono do perfil ou admin).
 *       404:
 *         description: Perfil profissional não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.put(
  "/me",
  authMiddleware,
  ...updateMyProfessionalValidator,
  validateRequest,
  asyncHandler(require("../controllers/professionalController").updateMyProfessionalHandler)
);

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
  validateRequest, // Corrected
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
  authMiddleware, // Apply basic auth middleware for creation
  ...createProfessionalValidator, // Spread validation middlewares
  validateRequest, // Corrected
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
  authMiddleware, // Ensure user is authenticated first
  checkProfessionalOwnerOrAdminMiddleware, // Apply new auth middleware
  ...updateProfessionalValidator, // Spread validation middlewares
  validateRequest, // Corrected
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
  professionalIdValidator[0], // Pass the single middleware function directly
  validateRequest, // Corrected
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
  authMiddleware,
  (req, res, next) => {
    req.params.id = req.params.professionalId; // For compatibility with the middleware
    next();
  },
  checkProfessionalOwnerOrAdminMiddleware, // Allow professional owner or admin
  ...professionalServiceAssociationValidator, // Spread validation middlewares
  validateRequest, // Corrected
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
  authMiddleware,
  (req, res, next) => {
    req.params.id = req.params.professionalId; // For compatibility with the middleware
    next();
  },
  checkProfessionalOwnerOrAdminMiddleware, // Allow professional owner or admin
  professionalIdValidator[0], // Pass the single middleware function directly
  serviceIdValidator[0],      // Pass the single middleware function directly
  validateRequest, // Corrected
  asyncHandler(removeServiceFromProfessionalHandler)
);

// Get all services for the authenticated professional
router.get(
  "/services",
  authMiddleware,
  asyncHandler(require("../controllers/professionalController").getMyProfessionalServicesHandler)
);

router.post(
  "/services",
  authMiddleware,
  asyncHandler(require("../controllers/professionalController").addServiceToMyProfessionalHandler)
);

router.delete(
  "/services/:serviceId",
  authMiddleware,
  serviceIdValidator[0],
  validateRequest,
  asyncHandler(require("../controllers/professionalController").removeServiceFromMyProfessionalHandler)
);

export default router;

