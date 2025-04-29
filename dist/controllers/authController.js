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
exports.register = exports.login = void 0;
const userRepository_1 = require("../repositories/userRepository");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client"); // Revertido: Importar de @prisma/client
const JWT_SECRET = process.env.JWT_SECRET || "your-default-secret"; // Use uma variável de ambiente!
// Função auxiliar para tratamento de erros
const handleError = (res, error, message) => {
    console.error(message, error);
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        // Erros específicos do Prisma
        if (error.code === 'P2002') {
            // Unique constraint violation
            // Verificar o campo específico se possível (ex: error.meta?.target)
            if (message.includes("registro")) { // Assumindo que a mensagem indica o contexto
                return res.status(409).json({ message: "Email já cadastrado." });
            }
            return res.status(409).json({ message: "Erro de conflito (possível duplicidade)." });
        }
        // Adicionar outros códigos de erro do Prisma conforme necessário
    }
    // Erro genérico
    return res.status(500).json({ message: "Erro interno do servidor" });
};
// Função de Login
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
    }
    try {
        const user = yield userRepository_1.userRepository.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: "Credenciais inválidas" });
        }
        const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Credenciais inválidas" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: "1h",
        });
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        return res.json({
            message: "Login bem-sucedido",
            token,
            user: userWithoutPassword
        });
    }
    catch (error) {
        return handleError(res, error, "Erro no login:");
    }
});
exports.login = login;
// Função de Registro
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, name, avatar } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ message: "Email, senha e nome são obrigatórios" });
    }
    try {
        const existingUser = yield userRepository_1.userRepository.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: "Email já cadastrado" });
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
        const { password: _ } = newUser, userWithoutPassword = __rest(newUser, ["password"]);
        const token = jsonwebtoken_1.default.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, {
            expiresIn: "1h",
        });
        return res.status(201).json({
            message: "Usuário registrado com sucesso",
            token,
            user: userWithoutPassword
        });
    }
    catch (error) {
        return handleError(res, error, "Erro no registro:");
    }
});
exports.register = register;
