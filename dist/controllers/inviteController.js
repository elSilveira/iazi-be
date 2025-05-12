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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvite = void 0;
const prisma_1 = require("../lib/prisma");
const crypto_1 = require("crypto");
// POST /api/invites - Generate a new invite code (admin only)
const generateInvite = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Allow any authenticated user to generate invites
        if (!req.user) {
            res.status(401).json({ message: "Usuário não autenticado." });
            return;
        }
        const code = (0, crypto_1.randomBytes)(8).toString("hex");
        const invite = yield prisma_1.prisma.inviteCode.create({
            data: { code },
        });
        res.status(201).json({ code: invite.code });
    }
    catch (error) {
        next(error);
    }
});
exports.generateInvite = generateInvite;
