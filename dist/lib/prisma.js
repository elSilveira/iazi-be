"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client"); // Revertido: Importação padrão
// Singleton para o cliente Prisma
class PrismaInstance {
    static getInstance() {
        if (!PrismaInstance.instance) {
            PrismaInstance.instance = new client_1.PrismaClient();
        }
        return PrismaInstance.instance;
    }
}
exports.prisma = PrismaInstance.getInstance();
