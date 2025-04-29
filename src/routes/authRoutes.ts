import express, { Router } from 'express';
import { login, register } from '../controllers/authController'; // Importar as funções refatoradas

const createRouter = (): Router => {
  const router = express.Router();

  /**
   * @swagger
   * tags:
   *   name: Autenticação
   *   description: Endpoints de autenticação e registro de usuários
   */

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Realiza o login do usuário
   *     tags: [Autenticação]
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
   *                 description: Email do usuário
   *               password:
   *                 type: string
   *                 format: password
   *                 description: Senha do usuário
   *     responses:
   *       200:
   *         description: Login bem-sucedido
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 token:
   *                   type: string
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       400:
   *         description: Requisição inválida (email ou senha faltando)
   *       401:
   *         description: Não autorizado (email ou senha inválidos)
   *       500:
   *         description: Erro interno do servidor
   */
  router.post('/login', login); // Usar a função login refatorada

  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Registra um novo usuário
   *     tags: [Autenticação]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - name
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 description: Email do novo usuário
   *               name:
   *                 type: string
   *                 description: Nome do novo usuário
   *               password:
   *                 type: string
   *                 format: password
   *                 description: Senha do novo usuário (mínimo 6 caracteres)
   *               avatar:
   *                 type: string
   *                 format: url
   *                 description: URL da imagem de avatar (opcional)
   *     responses:
   *       201:
   *         description: Usuário criado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 user:
   *                   $ref: '#/components/schemas/User' # Retorna o usuário criado (sem senha)
   *       400:
   *         description: Requisição inválida (dados faltando)
   *       409:
   *         description: Conflito (email já cadastrado)
   *       500:
   *         description: Erro interno do servidor
   */
  router.post('/register', register); // Adicionar a rota de registro

  return router;
};

export default createRouter;
