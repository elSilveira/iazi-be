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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = exports.register = exports.login = void 0;
const userRepository_1 = require("../repositories/userRepository");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken")); // Import Secret and SignOptions types
const gamificationService_1 = require("../services/gamificationService"); // Import gamification service and event types
// Carregar segredos e configurações de forma segura das variáveis de ambiente
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRATION = process.env.ACCESS_TOKEN_EXPIRATION || "15m"; // Default 15m
const REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION || "7d"; // Default 7d
if (!JWT_SECRET || !REFRESH_TOKEN_SECRET) {
    console.error("ERRO FATAL: Variáveis de ambiente JWT_SECRET ou REFRESH_TOKEN_SECRET não definidas.");
    process.exit(1); // Encerrar se as chaves não estiverem definidas
}
// Helper function for email validation (pode ser movida para utils)
const isValidEmail = (email) => {
    const emailRegex = /^[^"]+@[^"]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};
// Função de Login
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield userRepository_1.userRepository.findByEmail(email);
        if (!user) {
            const error = new Error("Credenciais inválidas");
            error.statusCode = 401;
            return next(error);
        }
        const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            const error = new Error("Credenciais inválidas");
            error.statusCode = 401;
            return next(error);
        }
        // Definir opções de assinatura explicitamente (usando 'as any' para contornar o erro de tipo)
        const accessTokenOptions = { expiresIn: ACCESS_TOKEN_EXPIRATION };
        const refreshTokenOptions = { expiresIn: REFRESH_TOKEN_EXPIRATION };
        // Gerar Access Token
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, accessTokenOptions);
        // Gerar Refresh Token
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, REFRESH_TOKEN_SECRET, refreshTokenOptions);
        // TODO: Consider storing the refresh token securely (e.g., in DB or Redis) for better revocation control
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        res.json({
            message: "Login bem-sucedido",
            accessToken,
            refreshToken, // Retornar o refresh token
            user: userWithoutPassword
        });
    }
    catch (error) {
        next(error);
    }
});
exports.login = login;
// Função de Registro
const register = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, name, avatar } = req.body;
    try {
        const existingUser = yield userRepository_1.userRepository.findByEmail(email);
        if (existingUser) {
            const error = new Error("Email já cadastrado");
            error.statusCode = 409; // Conflict
            return next(error);
        }
        const saltRounds = 10;
        const hashedPassword = yield bcrypt_1.default.hash(password, saltRounds);
        const userData = {
            email,
            password: hashedPassword,
            name,
            avatar,
        };
        const newUser = yield userRepository_1.userRepository.create(userData);
        // --- GAMIFICATION INTEGRATION START ---
        // Trigger USER_REGISTERED event after successful creation
        // Run this asynchronously, don't block the registration response
        gamificationService_1.gamificationService.triggerEvent(newUser.id, gamificationService_1.GamificationEventType.USER_REGISTERED)
            .catch(err => console.error("Gamification event trigger failed for USER_REGISTERED:", err));
        // --- GAMIFICATION INTEGRATION END ---
        const { password: _ } = newUser, userWithoutPassword = __rest(newUser, ["password"]);
        // Definir opções de assinatura explicitamente (usando 'as any' para contornar o erro de tipo)
        const accessTokenOptions = { expiresIn: ACCESS_TOKEN_EXPIRATION };
        const refreshTokenOptions = { expiresIn: REFRESH_TOKEN_EXPIRATION };
        // Gerar Access Token
        const accessToken = jsonwebtoken_1.default.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, accessTokenOptions);
        // Gerar Refresh Token
        const refreshToken = jsonwebtoken_1.default.sign({ userId: newUser.id }, REFRESH_TOKEN_SECRET, refreshTokenOptions);
        // TODO: Consider storing the refresh token securely
        res.status(201).json({
            message: "Usuário registrado com sucesso",
            accessToken,
            refreshToken, // Retornar o refresh token
            user: userWithoutPassword
        });
    }
    catch (error) {
        next(error);
    }
});
exports.register = register;
// Função para Refresh Token (Nova)
const refreshToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.body; // Espera o refresh token no corpo da requisição
    if (!token) {
        const error = new Error("Refresh token não fornecido");
        error.statusCode = 400; // Bad Request
        return next(error);
    }
    try {
        // Verificar o refresh token
        const decoded = jsonwebtoken_1.default.verify(token, REFRESH_TOKEN_SECRET);
        // TODO: Add check if refresh token is revoked (if stored)
        // Definir opções de assinatura explicitamente (usando 'as any' para contornar o erro de tipo)
        const accessTokenOptions = { expiresIn: ACCESS_TOKEN_EXPIRATION };
        // Gerar um novo access token
        const accessToken = jsonwebtoken_1.default.sign({ userId: decoded.userId }, JWT_SECRET, accessTokenOptions);
        res.json({
            message: "Access token atualizado com sucesso",
            accessToken
        });
    }
    catch (error) {
        // Se a verificação falhar (token inválido, expirado, etc.)
        const err = new Error("Refresh token inválido ou expirado");
        err.statusCode = 401; // Unauthorized
        next(err);
    }
});
exports.refreshToken = refreshToken;
