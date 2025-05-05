"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Estender a interface Request do Express para incluir a propriedade user
// interface AuthRequest extends Request { // Removed, using global declaration
//   user?: { id: string };
// }
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        // Usar res.status().json() e retornar explicitamente para evitar chamar next()
        res.status(401).json({ message: "Token de autenticação não fornecido ou inválido." });
        return;
    }
    const token = authHeader.split(" ")[1];
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error("Erro crítico: JWT_SECRET não definido no ambiente.");
        // Usar res.status().json() e retornar explicitamente
        res.status(500).json({ message: "Erro interno do servidor." });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        // Anexar o ID do usuário decodificado ao objeto req para uso posterior
        req.user = { id: decoded.userId };
        next(); // Chamar next() apenas se o token for válido
    }
    catch (error) {
        // Tratar erros específicos do JWT
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ message: "Token expirado." });
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ message: "Token inválido." });
        }
        else {
            // Tratar outros erros inesperados
            console.error("Erro ao verificar token:", error);
            res.status(500).json({ message: "Erro interno ao processar token." });
        }
        // Não chamar next() em caso de erro
        return;
    }
};
exports.authMiddleware = authMiddleware;
