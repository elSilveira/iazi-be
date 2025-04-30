import { Router } from "express";
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "../controllers/serviceController";
import { 
  createServiceValidator, 
  updateServiceValidator, 
  serviceIdValidator 
} from "../validators/serviceValidators";
import { validateRequest } from "../middlewares/validationMiddleware";
// TODO: Adicionar middleware de autenticação/autorização para rotas protegidas (create, update, delete)

const router = Router();

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Obtém uma lista de todos os serviços
 *     tags: [Services]
 *     # security:
 *     #   - bearerAuth: [] # Descomente se a autenticação for necessária
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtra serviços por ID da empresa
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtra serviços por categoria
 *       # Adicionar outros parâmetros de filtro/paginação se necessário
 *     responses:
 *       200:
 *         description: Lista de serviços retornada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Service'
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/", getAllServices); // Validação de query param pode ser adicionada se necessário

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Obtém detalhes de um serviço específico pelo ID
 *     tags: [Services]
 *     # security:
 *     #   - bearerAuth: [] # Descomente se a autenticação for necessária
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do serviço a ser obtido
 *     responses:
 *       200:
 *         description: Detalhes do serviço retornados com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       400:
 *         description: ID inválido fornecido.
 *       404:
 *         description: Serviço não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/:id", serviceIdValidator, validateRequest, getServiceById);

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Cria um novo serviço
 *     tags: [Services]
 *     # security:
 *     #   - bearerAuth: [] # Requer autenticação para criar serviço
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - duration
 *               - category
 *               - companyId
 *             properties:
 *               name: { type: string, description: 'Nome do serviço' }
 *               description: { type: string, description: 'Descrição do serviço' }
 *               price: { type: string, description: 'Preço do serviço' }
 *               duration: { type: string, description: 'Duração do serviço (ex: "45min")' }
 *               category: { type: string, description: 'Categoria do serviço' }
 *               image: { type: string, format: url, nullable: true, description: 'URL da imagem do serviço' }
 *               companyId: { type: string, format: uuid, description: 'ID da empresa que oferece o serviço' }
 *     responses:
 *       201:
 *         description: Serviço criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       400:
 *         description: "Erro de validação nos dados fornecidos (ex: companyId inválido)."
 *       401:
 *         description: Não autorizado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/", createServiceValidator, validateRequest, createService);

/**
 * @swagger
 * /api/services/{id}:
 *   put:
 *     summary: Atualiza um serviço existente pelo ID
 *     tags: [Services]
 *     # security:
 *     #   - bearerAuth: [] # Requer autenticação para atualizar serviço
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do serviço a ser atualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               price: { type: string }
 *               duration: { type: string }
 *               category: { type: string }
 *               image: { type: string, format: url, nullable: true }
 *               # companyId geralmente não é atualizado aqui
 *     responses:
 *       200:
 *         description: Serviço atualizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       400:
 *         description: Erro de validação ou ID inválido.
 *       401:
 *         description: Não autorizado.
 *       404:
 *         description: Serviço não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.put("/:id", updateServiceValidator, validateRequest, updateService);

/**
 * @swagger
 * /api/services/{id}:
 *   delete:
 *     summary: Deleta um serviço existente pelo ID
 *     tags: [Services]
 *     # security:
 *     #   - bearerAuth: [] # Requer autenticação/autorização para deletar serviço
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do serviço a ser deletado
 *     responses:
 *       204:
 *         description: Serviço deletado com sucesso (sem conteúdo).
 *       400:
 *         description: ID inválido fornecido.
 *       401:
 *         description: Não autorizado.
 *       404:
 *         description: Serviço não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.delete("/:id", serviceIdValidator, validateRequest, deleteService);

export default router;

