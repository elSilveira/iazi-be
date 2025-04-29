"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
// Função factory para criar o router de autenticação
const createAuthRouter = () => {
    const router = express_1.default.Router();
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
    // @ts-ignore
    router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () { return yield (0, authController_1.login)(req, res); }));
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
    // @ts-ignore
    router.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () { return yield (0, authController_1.register)(req, res); }));
    return router;
};
exports.default = createAuthRouter;
