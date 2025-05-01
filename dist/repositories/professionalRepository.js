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
exports.professionalRepository = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
exports.professionalRepository = {
    getAll(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.professional.findMany({
                where: companyId ? { companyId } : {},
                include: { services: { include: { service: true } } }, // Incluir serviços associados
            });
        });
    },
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.professional.findUnique({
                where: { id },
                include: { services: { include: { service: true } } }, // Incluir serviços associados
            });
        });
    },
    create(data, serviceIds) {
        return __awaiter(this, void 0, void 0, function* () {
            // Usar transação para criar o profissional e conectar aos serviços
            return prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const newProfessional = yield tx.professional.create({
                    data,
                });
                if (serviceIds && serviceIds.length > 0) {
                    const serviceConnections = serviceIds.map((serviceId) => ({
                        professionalId: newProfessional.id,
                        serviceId: serviceId,
                    }));
                    yield tx.professionalService.createMany({
                        data: serviceConnections,
                        skipDuplicates: true, // Evitar erro se a combinação já existir (embora não deva acontecer na criação)
                    });
                }
                // Retornar o profissional com os serviços incluídos
                return tx.professional.findUniqueOrThrow({
                    where: { id: newProfessional.id },
                    include: { services: { include: { service: true } } },
                });
            }));
        });
    },
    update(id, data, serviceIds) {
        return __awaiter(this, void 0, void 0, function* () {
            // Usar transação para atualizar o profissional e suas conexões de serviço
            try {
                return yield prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    // 1. Atualizar os dados do profissional
                    const updatedProfessional = yield tx.professional.update({
                        where: { id },
                        data,
                    });
                    // 2. Gerenciar conexões de serviço (se serviceIds for fornecido)
                    if (serviceIds !== undefined) {
                        // 2a. Remover conexões existentes
                        yield tx.professionalService.deleteMany({
                            where: { professionalId: id },
                        });
                        // 2b. Criar novas conexões (se houver serviceIds)
                        if (serviceIds.length > 0) {
                            const serviceConnections = serviceIds.map((serviceId) => ({
                                professionalId: id,
                                serviceId: serviceId,
                            }));
                            yield tx.professionalService.createMany({
                                data: serviceConnections,
                                skipDuplicates: true,
                            });
                        }
                    }
                    // 3. Retornar o profissional atualizado com os serviços incluídos
                    return tx.professional.findUniqueOrThrow({
                        where: { id: updatedProfessional.id },
                        include: { services: { include: { service: true } } },
                    });
                }));
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                    // P2025: Registro para atualizar não encontrado
                    return null;
                }
                throw error;
            }
        });
    },
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // Usar transação para garantir que todas as operações ocorram
            try {
                return yield prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    // 1. Desconectar de ProfessionalService
                    yield tx.professionalService.deleteMany({ where: { professionalId: id } });
                    // 2. Desassociar Agendamentos (definir professionalId como null)
                    // A regra onDelete: SetNull no schema deve cuidar disso automaticamente.
                    // Mas podemos fazer explicitamente se quisermos mais controle ou se a regra não existir.
                    // await tx.appointment.updateMany({ 
                    //   where: { professionalId: id }, 
                    //   data: { professionalId: null } 
                    // });
                    // 3. Desassociar Avaliações (definir professionalId como null)
                    // O schema já tem professionalId? e onDelete: SetNull implícito por ser opcional?
                    // Vamos fazer explicitamente para garantir.
                    yield tx.review.updateMany({
                        where: { professionalId: id },
                        data: { professionalId: null }
                    });
                    // 4. Deletar o profissional
                    const deletedProfessional = yield tx.professional.delete({
                        where: { id },
                    });
                    return deletedProfessional;
                }));
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                    // P2025: Registro para deletar não encontrado
                    return null;
                }
                // Tratar outros erros potenciais (ex: P2003 se alguma FK ainda impedir)
                throw error;
            }
        });
    },
};
