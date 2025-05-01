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
exports.updateUserProfile = exports.getUserProfile = void 0;
const userRepository_1 = require("../repositories/userRepository");
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("../lib/prisma");
// Get current user profile
const getUserProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        // This should technically not happen if authMiddleware is working correctly
        res.status(401).json({ message: "Usuário não autenticado." });
        return;
    }
    try {
        const user = yield userRepository_1.userRepository.findById(userId);
        if (!user) {
            res.status(404).json({ message: "Perfil de usuário não encontrado." });
            return;
        }
        // Exclude password from the response
        const { password } = user, userProfile = __rest(user, ["password"]);
        res.json(userProfile);
    }
    catch (error) {
        next(error);
    }
});
exports.getUserProfile = getUserProfile;
// Update current user profile
const updateUserProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { name, email, avatar, password } = req.body;
    if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado." });
        return;
    }
    try {
        const updateData = {};
        if (name)
            updateData.name = name;
        if (email) {
            // Check if email is already taken by another user
            const existingUser = yield userRepository_1.userRepository.findByEmail(email);
            if (existingUser && existingUser.id !== userId) {
                res.status(409).json({ message: "Email já está em uso por outra conta." });
                return;
            }
            updateData.email = email;
        }
        if (avatar)
            updateData.avatar = avatar;
        if (password) {
            // Hash the new password if provided
            const saltRounds = 10;
            updateData.password = yield bcrypt_1.default.hash(password, saltRounds);
        }
        const updatedUser = yield prisma_1.prisma.user.update({
            where: { id: userId },
            data: updateData,
        });
        // Exclude password from the response
        const { password: _ } = updatedUser, userProfile = __rest(updatedUser, ["password"]);
        res.json({ message: "Perfil atualizado com sucesso.", user: userProfile });
    }
    catch (error) {
        // Handle potential Prisma errors (e.g., record not found)
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: "Usuário não encontrado para atualização." });
            return;
        }
        next(error);
    }
});
exports.updateUserProfile = updateUserProfile;
