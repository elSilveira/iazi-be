"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// Alternativa para resolver o problema de tipagem
const createRouter = () => {
    const router = express_1.default.Router();
    /**
     * @swagger
     * tags:
     *   name: Autenticação
     *   description: Endpoints de autenticação de usuários
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
     */
    router.post('/login', (req, res) => {
        const { email, password } = req.body;
        // Validação básica
        if (!email || !password) {
            res.status(400).json({ message: 'Email e senha são obrigatórios' });
            return;
        }
        // Mock de usuário para teste
        if (email && password.length >= 6) {
            const mockUser = {
                id: 'user-123',
                name: 'Usuário Teste Backend',
                email: email,
                avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
            };
            // Em um ambiente real, usaríamos JWT
            const token = 'mock-jwt-token-123456';
            res.json({
                message: 'Login bem-sucedido',
                token,
                user: mockUser
            });
        }
        else {
            res.status(401).json({ message: 'Email ou senha inválidos' });
        }
    });
    return router;
};
exports.default = createRouter;
