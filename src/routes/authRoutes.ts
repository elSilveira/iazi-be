import { Router } from "express";
import { login, register, refreshToken } from "../controllers/authController"; // Importa refreshToken
import { registerValidator, loginValidator } from "../validators/authValidators";


const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registra um novo usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email: { type: string, format: email, description: 'Email do usuário' }
 *               password: { type: string, format: password, description: 'Senha do usuário (mínimo 8 caracteres)' }
 *               name: { type: string, description: 'Nome do usuário' }
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *                 accessToken: { type: string, description: 'Token de acesso JWT' }
 *                 refreshToken: { type: string, description: 'Token de atualização JWT' }
 *       400:
 *         description: Erro de validação (email já existe, senha inválida, etc.).
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/register", registerValidator, validateRequest, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autentica um usuário e retorna tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email: { type: string, format: email, description: 'Email do usuário' }
 *               password: { type: string, format: password, description: 'Senha do usuário' }
 *     responses:
 *       200:
 *         description: Login bem-sucedido.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string, description: 'Token de acesso JWT' }
 *                 refreshToken: { type: string, description: 'Token de atualização JWT' }
 *       400:
 *         description: Erro de validação.
 *       401:
 *         description: Credenciais inválidas.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/login", loginValidator, validateRequest, login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Atualiza o token de acesso usando um refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken: { type: string, description: 'Token de atualização JWT válido' }
 *     responses:
 *       200:
 *         description: Tokens atualizados com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string, description: 'Novo token de acesso JWT' }
 *                 refreshToken: { type: string, description: 'Novo token de atualização JWT (opcional, pode ser o mesmo)' }
 *       400:
 *         description: Refresh token não fornecido.
 *       401:
 *         description: Refresh token inválido ou expirado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/refresh", refreshToken); // Não precisa de validação específica aqui, o controller verifica o token

export default router;

