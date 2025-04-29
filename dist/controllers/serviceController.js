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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteService = exports.updateService = exports.createService = exports.getServiceById = exports.getAllServices = void 0;
const serviceRepository_1 = require("../repositories/serviceRepository");
const client_1 = require("@prisma/client");
// Função auxiliar para tratamento de erros
const handleError = (res, error, message) => {
    console.error(message, error);
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2003") {
            // FK constraint failed
            return res.status(400).json({ message: "ID da empresa inválido." });
        }
        if (error.code === "P2025") {
            // Record not found for update/delete
            return res.status(404).json({ message: "Registro não encontrado para a operação." });
        }
    }
    return res.status(500).json({ message: "Erro interno do servidor" });
};
// Obter todos os serviços (opcionalmente filtrados por companyId)
const getAllServices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyId } = req.query;
    try {
        const services = yield serviceRepository_1.serviceRepository.getAll(companyId);
        return res.json(services);
    }
    catch (error) {
        return handleError(res, error, "Erro ao buscar serviços:");
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
        return handleError(res, error, `Erro ao buscar serviço ${id}:`);
    }
});
exports.getServiceById = getServiceById;
// Criar um novo serviço
const createService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Extrair dados do corpo da requisição
    const { name, description, price, duration, image, category, companyId } = req.body;
    // Validação básica
    if (!name || price === undefined || !companyId) {
        return res.status(400).json({ message: "Nome, preço e ID da empresa são obrigatórios" });
    }
    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ message: "O preço deve ser um valor numérico não negativo." });
    }
    const numericDuration = duration !== undefined ? Number(duration) : undefined;
    if (numericDuration !== undefined && (isNaN(numericDuration) || numericDuration <= 0)) {
        return res.status(400).json({ message: "A duração deve ser um valor numérico positivo, se fornecida." });
    }
    try {
        // Montar o objeto de dados para o Prisma usando 'connect'
        const dataToCreate = {
            name,
            description: description, // opcional
            price: String(numericPrice),
            duration: numericDuration !== undefined ? String(numericDuration) : "", // opcional, default to empty string
            image: image, // opcional
            category: category, // opcional
            company: { connect: { id: companyId } },
            // rating, appointments, professionals, reviews são definidos por padrão no schema
        };
        const newService = yield serviceRepository_1.serviceRepository.create(dataToCreate);
        return res.status(201).json(newService);
    }
    catch (error) {
        return handleError(res, error, "Erro ao criar serviço:");
    }
});
exports.createService = createService;
// Atualizar um serviço existente
const updateService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // Não permitir atualização do companyId via este endpoint
    const _a = req.body, { companyId } = _a, dataToUpdate = __rest(_a, ["companyId"]);
    // Validar preço se fornecido
    if (dataToUpdate.price !== undefined) {
        const numericPrice = Number(dataToUpdate.price);
        if (isNaN(numericPrice) || numericPrice < 0) {
            return res.status(400).json({ message: "O preço deve ser um valor numérico não negativo." });
        }
        dataToUpdate.price = numericPrice;
    }
    // Validar duração se fornecida
    if (dataToUpdate.duration !== undefined) {
        const numericDuration = Number(dataToUpdate.duration);
        if (isNaN(numericDuration) || numericDuration <= 0) {
            return res.status(400).json({ message: "A duração deve ser um valor numérico positivo." });
        }
        dataToUpdate.duration = numericDuration;
    }
    try {
        const updatedService = yield serviceRepository_1.serviceRepository.update(id, dataToUpdate);
        if (!updatedService) {
            return res.status(404).json({ message: "Serviço não encontrado para atualização" });
        }
        return res.json(updatedService);
    }
    catch (error) {
        return handleError(res, error, `Erro ao atualizar serviço ${id}:`);
    }
});
exports.updateService = updateService;
// Deletar um serviço
const deleteService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const deletedService = yield serviceRepository_1.serviceRepository.delete(id);
        if (!deletedService) {
            // O repositório já trata P2025 retornando null
            return res.status(404).json({ message: "Serviço não encontrado para exclusão" });
        }
        return res.status(200).json({ message: "Serviço excluído com sucesso", service: deletedService });
    }
    catch (error) {
        // Tratar erro P2003 (FK constraint) se houver dependências não tratadas no repositório
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
            return res.status(409).json({ message: "Não é possível excluir o serviço pois existem registros associados (ex: agendamentos, avaliações)." });
        }
        return handleError(res, error, `Erro ao deletar serviço ${id}:`);
    }
});
exports.deleteService = deleteService;
