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
const client_1 = require("@prisma/client");
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
    create(data, addressData) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.company.create({
                data: Object.assign(Object.assign({}, data), (addressData && {
                    address: {
                        create: addressData,
                    }
                })),
                include: { address: true } // Incluir endereço no retorno
            });
        });
    },
    update(id, data, addressData) {
        return __awaiter(this, void 0, void 0, function* () {
            // addressData = null indica que o endereço deve ser removido (se existir)
            // addressData = objeto indica que deve ser criado ou atualizado
            try {
                return yield prisma_1.prisma.company.update({
                    where: { id },
                    data: Object.assign(Object.assign({}, data), { address: addressData === null
                            ? { delete: true } // Deleta o endereço existente se addressData for null
                            : addressData !== undefined
                                ? {
                                    upsert: {
                                        create: addressData, // Type assertion needed
                                        update: addressData, // Type assertion needed
                                    }
                                }
                                : undefined }),
                    include: { address: true } // Incluir endereço no retorno
                });
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                    // P2025: An operation failed because it depends on one or more records that were required but not found. (e.g. Record to update not found.)
                    return null;
                }
                throw error;
            }
        });
    },
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // onDelete: Cascade no schema do Address deve cuidar da exclusão do endereço associado.
            try {
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
