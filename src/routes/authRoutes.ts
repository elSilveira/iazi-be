import express, { Router, Request, Response } from "express";
import { login, register } from "../controllers/authController";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticação de usuários
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autentica um usuário
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
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login bem-sucedido, retorna token JWT e dados do usuário
 *       400:
 *         description: Email ou senha não fornecidos
 *       401:
 *         description: Credenciais inválidas
 *       500:
 *         description: Erro interno do servidor
 */
router.post("/login", async (req: Request, res: Response) => {
  return await login(req, res);
});

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
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               name:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: url
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso, retorna token JWT e dados do usuário
 *       400:
 *         description: Dados obrigatórios não fornecidos
 *       409:
 *         description: Email já cadastrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post("/register", async (req: Request, res: Response) => {
  return await register(req, res);
});

export default router;
