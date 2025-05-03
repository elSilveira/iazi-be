"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const professionalController_1 = require("../controllers/professionalController");
const professionalValidators_1 = require("../validators/professionalValidators");
const serviceValidators_1 = require("../validators/serviceValidators"); // Importar serviceIdValidator
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
// TODO: Adicionar middleware de autenticação/autorização para rotas protegidas
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/professionals:
 *   get:
 *     summary: Obtém uma lista de todos os profissionais
 *     tags: [Professionals]
 *     # security:
 *     #   - bearerAuth: [] # Descomente se a autenticação for necessária
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtra profissionais por ID da empresa
 *       # Adicionar outros parâmetros de filtro/paginação se necessário
 *     responses:
 *       200:
 *         description: Lista de profissionais retornada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Professional'
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/", professionalController_1.getAllProfessionals);
/**
 * @swagger
 * /api/professionals/{id}:
 *   get:
 *     summary: Obtém detalhes de um profissional específico pelo ID
 *     tags: [Professionals]
 *     # security:
 *     #   - bearerAuth: [] # Descomente se a autenticação for necessária
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do profissional a ser obtido
 *     responses:
 *       200:
 *         description: Detalhes do profissional retornados com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Professional'
 *       400:
 *         description: ID inválido fornecido.
 *       404:
 *         description: Profissional não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/:id", professionalValidators_1.professionalIdValidator, validationMiddleware_1.validateRequest, professionalController_1.getProfessionalById);
/**
 * @swagger
 * /api/professionals:
 *   post:
 *     summary: Cria um novo profissional
 *     tags: [Professionals]
 *     # security:
 *     #   - bearerAuth: [] # Requer autenticação para criar profissional
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - role
 *               - companyId
 *             properties:
 *               name: { type: string, description: 'Nome do profissional' }
 *               role: { type: string, description: 'Cargo do profissional' }
 *               image: { type: string, format: url, nullable: true, description: 'URL da foto do profissional' }
 *               companyId: { type: string, format: uuid, description: 'ID da empresa associada' }
 *     responses:
 *       201:
 *         description: Profissional criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Professional'
 *       400:
 *         description: "Erro de validação nos dados fornecidos (ex: companyId inválido)."
 *       401:
 *         description: Não autorizado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/", professionalValidators_1.createProfessionalValidator, validationMiddleware_1.validateRequest, professionalController_1.createProfessional);
/**
 * @swagger
 * /api/professionals/{id}:
 *   put:
 *     summary: Atualiza um profissional existente pelo ID
 *     tags: [Professionals]
 *     # security:
 *     #   - bearerAuth: [] # Requer autenticação para atualizar profissional
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do profissional a ser atualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               role: { type: string }
 *               image: { type: string, format: url, nullable: true }
 *               # companyId geralmente não é atualizado aqui
 *     responses:
 *       200:
 *         description: Profissional atualizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Professional'
 *       400:
 *         description: Erro de validação ou ID inválido.
 *       401:
 *         description: Não autorizado.
 *       404:
 *         description: Profissional não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.put("/:id", professionalValidators_1.updateProfessionalValidator, validationMiddleware_1.validateRequest, professionalController_1.updateProfessional);
/**
 * @swagger
 * /api/professionals/{id}:
 *   delete:
 *     summary: Deleta um profissional existente pelo ID
 *     tags: [Professionals]
 *     # security:
 *     #   - bearerAuth: [] # Requer autenticação/autorização para deletar profissional
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do profissional a ser deletado
 *     responses:
 *       204:
 *         description: Profissional deletado com sucesso (sem conteúdo).
 *       400:
 *         description: ID inválido fornecido.
 *       401:
 *         description: Não autorizado.
 *       404:
 *         description: Profissional não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.delete("/:id", professionalValidators_1.professionalIdValidator, validationMiddleware_1.validateRequest, professionalController_1.deleteProfessional);
/**
 * @swagger
 * /api/professionals/{professionalId}/services:
 *   post:
 *     summary: Associa um serviço a um profissional
 *     tags: [Professionals]
 *     # security:
 *     #   - bearerAuth: [] # Requer autenticação
 *     parameters:
 *       - in: path
 *         name: professionalId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do profissional
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *             properties:
 *               serviceId: { type: string, format: uuid, description: 'ID do serviço a ser associado' }
 *               price: { type: string, nullable: true, description: 'Preço específico (opcional)' }
 *     responses:
 *       201:
 *         description: Serviço associado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfessionalService'
 *       400:
 *         description: Erro de validação (IDs inválidos, associação já existe?).
 *       401:
 *         description: Não autorizado.
 *       404:
 *         description: Profissional ou Serviço não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/:professionalId/services", professionalValidators_1.professionalServiceAssociationValidator, validationMiddleware_1.validateRequest, professionalController_1.addServiceToProfessional);
/**
 * @swagger
 * /api/professionals/{professionalId}/services/{serviceId}:
 *   delete:
 *     summary: Desassocia um serviço de um profissional
 *     tags: [Professionals]
 *     # security:
 *     #   - bearerAuth: [] # Requer autenticação
 *     parameters:
 *       - in: path
 *         name: professionalId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do profissional
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do serviço a ser desassociado
 *     responses:
 *       204:
 *         description: Serviço desassociado com sucesso (sem conteúdo).
 *       400:
 *         description: IDs inválidos fornecidos.
 *       401:
 *         description: Não autorizado.
 *       404:
 *         description: Associação não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.delete("/:professionalId/services/:serviceId", 
// Usar os validadores importados corretamente
[professionalValidators_1.professionalIdValidator[0], serviceValidators_1.serviceIdValidator[0]], validationMiddleware_1.validateRequest, professionalController_1.removeServiceFromProfessional);
exports.default = router;
