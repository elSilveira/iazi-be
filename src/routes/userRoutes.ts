import { Router } from "express";
import { getUserProfile, updateUserProfile } from "../controllers/userController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { updateUserValidator } from "../validators/userValidators";
import { validateRequest } from "../middlewares/validationMiddleware";

const router = Router();

// Apply auth middleware to all user routes
router.use(authMiddleware);

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
router.get("/me", getUserProfile);

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
 *               phone:
 *                 type: string
 *                 description: Novo telefone do usuário.
 *                 example: "99999-8888"
 *               address:
 *                 type: string
 *                 description: Novo endereço do usuário.
 *                 example: "Rua Nova, 456"
 *               bio:
 *                 type: string
 *                 description: Nova biografia do usuário.
 *                 example: "Desenvolvedor apaixonado por tecnologia."
 *               avatarUrl:
 *                 type: string
 *                 format: url
 *                 description: Nova URL do avatar do usuário.
 *                 example: "https://example.com/new-avatar.jpg"
 *             # Adicione outros campos atualizáveis conforme necessário
 *     responses:
 *       200:
 *         description: Perfil do usuário atualizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos na requisição (erro de validação).
 *       401:
 *         description: Não autorizado.
 *       500:
 *         description: Erro interno do servidor ao atualizar.
 */
router.put("/me", updateUserValidator, validateRequest, updateUserProfile);

export default router;

