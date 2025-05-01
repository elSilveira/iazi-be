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
// Obter todos os serviços (opcionalmente filtrados por companyId)
const getAllServices = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyId } = req.query;
    // A validação do formato do companyId (se fornecido) será feita pelo express-validator
    try {
        const services = yield serviceRepository_1.serviceRepository.getAll(companyId);
        res.json(services);
    }
    catch (error) {
        next(error); // Passa o erro para o middleware global
    }
});
exports.getAllServices = getAllServices;
// Obter um serviço específico pelo ID
const getServiceById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // A validação do formato do ID será feita pelo express-validator
    try {
        const service = yield serviceRepository_1.serviceRepository.findById(id);
        if (!service) {
            // Lança um erro que será capturado pelo middleware global (P2025)
            const error = new Error("Serviço não encontrado");
            error.statusCode = 404;
            return next(error);
        }
        res.json(service);
    }
    catch (error) {
        next(error);
    }
});
exports.getServiceById = getServiceById;
// Criar um novo serviço
const createService = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // A validação dos dados (nome, preço, companyId, etc.) será feita pelo express-validator
    const { name, description, price, duration, image, category, companyId } = req.body;
    try {
        // Montar o objeto de dados para o Prisma usando 'connect'
        // Os validadores devem garantir que price e duration são strings válidas
        const dataToCreate = {
            name,
            description,
            price, // Assumindo que o validator garante que é uma string válida
            duration, // Assumindo que o validator garante que é uma string válida
            image,
            category,
            company: { connect: { id: companyId } },
        };
        const newService = yield serviceRepository_1.serviceRepository.create(dataToCreate);
        res.status(201).json(newService);
    }
    catch (error) {
        // Erros, incluindo P2003 (FK inválida), serão tratados pelo middleware global
        next(error);
    }
});
exports.createService = createService;
// Atualizar um serviço existente
const updateService = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // A validação do formato do ID e dos dados do body será feita pelo express-validator
    // Não permitir atualização do companyId via este endpoint
    const _a = req.body, { companyId } = _a, dataToUpdate = __rest(_a, ["companyId"]);
    try {
        // Os validadores devem garantir que price e duration (se fornecidos) são strings válidas
        const updatedService = yield serviceRepository_1.serviceRepository.update(id, dataToUpdate);
        // O repositório deve lançar um erro se o serviço não for encontrado (Prisma P2025)
        // que será tratado pelo middleware global
        res.json(updatedService);
    }
    catch (error) {
        // Erros, incluindo P2025 (não encontrado), serão tratados pelo middleware global
        next(error);
    }
});
exports.updateService = updateService;
// Deletar um serviço
const deleteService = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // A validação do formato do ID será feita pelo express-validator
    try {
        const deletedService = yield serviceRepository_1.serviceRepository.delete(id);
        // O repositório deve lançar um erro se o serviço não for encontrado (Prisma P2025)
        // que será tratado pelo middleware global
        res.status(200).json({ message: "Serviço excluído com sucesso", service: deletedService });
    }
    catch (error) {
        // Erros, incluindo P2025 (não encontrado) ou P2003 (restrição FK), serão tratados pelo middleware global
        next(error);
    }
});
exports.deleteService = deleteService;
