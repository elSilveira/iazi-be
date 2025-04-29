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
exports.deleteService = exports.updateService = exports.createService = exports.getServiceById = exports.getAllServices = void 0;
const serviceRepository_1 = require("../repositories/serviceRepository");
const client_1 = require("@prisma/client"); // Revertido: Importar de @prisma/client
// Obter todos os serviços (opcionalmente filtrados por companyId)
const getAllServices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyId } = req.query;
    try {
        const services = yield serviceRepository_1.serviceRepository.getAll(companyId);
        return res.json(services);
    }
    catch (error) {
        console.error("Erro ao buscar serviços:", error);
        return res.status(500).json({ message: "Erro interno do servidor" });
    }
});
exports.getAllServices = getAllServices;
// Obter um serviço específico pelo ID
const getServiceById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const service = yield serviceRepository_1.serviceRepository.findById(id);
        if (!service) {
            return res.status(404).json({ message: "Serviço não encontrado" });
        }
        return res.json(service);
    }
    catch (error) {
        console.error(`Erro ao buscar serviço ${id}:`, error);
        return res.status(500).json({ message: "Erro interno do servidor" });
    }
});
exports.getServiceById = getServiceById;
// Criar um novo serviço
const createService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = req.body;
    // Validação básica
    if (!data.name || !data.price || !data.companyId) {
        return res.status(400).json({ message: "Nome, preço e ID da empresa são obrigatórios" });
    }
    try {
        const newService = yield serviceRepository_1.serviceRepository.create(data);
        return res.status(201).json(newService);
    }
    catch (error) {
        console.error("Erro ao criar serviço:", error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
            return res.status(400).json({ message: "ID da empresa inválido." });
        }
        return res.status(500).json({ message: "Erro interno do servidor" });
    }
});
exports.createService = createService;
// Atualizar um serviço existente
const updateService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const data = req.body;
    try {
        const updatedService = yield serviceRepository_1.serviceRepository.update(id, data);
        if (!updatedService) {
            return res.status(404).json({ message: "Serviço não encontrado para atualização" });
        }
        return res.json(updatedService);
    }
    catch (error) {
        console.error(`Erro ao atualizar serviço ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return res.status(404).json({ message: "Serviço não encontrado para atualização." });
        }
        return res.status(500).json({ message: "Erro interno do servidor" });
    }
});
exports.updateService = updateService;
// Deletar um serviço
const deleteService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const deletedService = yield serviceRepository_1.serviceRepository.delete(id);
        if (!deletedService) {
            return res.status(404).json({ message: "Serviço não encontrado para exclusão" });
        }
        return res.status(200).json({ message: "Serviço excluído com sucesso", service: deletedService });
    }
    catch (error) {
        console.error(`Erro ao deletar serviço ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                return res.status(404).json({ message: "Serviço não encontrado para exclusão." });
            }
            if (error.code === "P2003") {
                return res.status(409).json({ message: "Não é possível excluir o serviço pois existem registros associados." });
            }
        }
        return res.status(500).json({ message: "Erro interno do servidor" });
    }
});
exports.deleteService = deleteService;
