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
exports.companyRepository = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client"); // Revertido: Importar de @prisma/client
exports.companyRepository = {
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.company.findMany({
                include: { address: true }, // Incluir endereço
            });
        });
    },
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.company.findUnique({
                where: { id },
                include: { address: true }, // Incluir endereço
            });
        });
    },
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // A criação do endereço deve ser tratada aqui ou no serviço
            // Exemplo: Se data.address for fornecido, usar connectOrCreate ou create
            return prisma_1.prisma.company.create({
                data,
                // include: { address: true } // Opcional incluir endereço no retorno
            });
        });
    },
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // A atualização do endereço também precisa ser tratada
            try {
                return yield prisma_1.prisma.company.update({
                    where: { id },
                    data,
                    // include: { address: true } // Opcional incluir endereço no retorno
                });
            }
            catch (error) {
                // Tratar erro P2025 (Registro não encontrado) se necessário, embora findById já possa fazer isso
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                    return null;
                }
                throw error;
            }
        });
    },
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // Considerar o que fazer com o endereço associado (onDelete: Cascade no schema?)
            try {
                // Se não houver cascade, deletar o endereço primeiro ou desconectar
                // await prisma.address.delete({ where: { companyId: id } }); // Exemplo
                return yield prisma_1.prisma.company.delete({
                    where: { id },
                });
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                    return null;
                }
                throw error;
            }
        });
    },
};
