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
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userRepository_1 = require("../repositories/userRepository"); // Importar o repositório de usuário
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Token de autenticação não fornecido ou inválido." });
        return;
    }
    const token = authHeader.split(" ")[1];
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error("Erro crítico: JWT_SECRET não definido no ambiente.");
        res.status(500).json({ message: "Erro interno do servidor." });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        // Buscar o usuário no banco de dados para obter o role
        const user = yield userRepository_1.userRepository.findById(decoded.userId);
        if (!user) {
            res.status(401).json({ message: "Usuário associado ao token não encontrado." });
            return;
        }
        // Anexar o ID e o role do usuário ao objeto req
        req.user = { id: user.id, role: user.role };
        next(); // Chamar next() apenas se o token for válido e o usuário encontrado
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ message: "Token expirado." });
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ message: "Token inválido." });
        }
        else {
            console.error("Erro ao verificar token ou buscar usuário:", error);
            res.status(500).json({ message: "Erro interno ao processar token." });
        }
        return;
    }
});
exports.authMiddleware = authMiddleware;
