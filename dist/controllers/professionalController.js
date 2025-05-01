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
exports.removeServiceFromProfessional = exports.addServiceToProfessional = exports.deleteProfessional = exports.updateProfessional = exports.createProfessional = exports.getProfessionalById = exports.getAllProfessionals = void 0;
const professionalRepository_1 = require("../repositories/professionalRepository");
const client_1 = require("@prisma/client");
// Helper function for UUID validation
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
};
// Obter todos os profissionais (opcionalmente filtrados por companyId)
const getAllProfessionals = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyId } = req.query;
    // Validar companyId se fornecido
    if (companyId && !isValidUUID(companyId)) {
        res.status(400).json({ message: "Formato de ID da empresa inválido." });
        return; // Return void
    }
    try {
        const professionals = yield professionalRepository_1.professionalRepository.getAll(companyId);
        res.json(professionals);
    }
    catch (error) {
        console.error("Erro ao buscar profissionais:", error);
        // Pass error to a potential global error handler
        next(error); // Use next for errors
    }
});
exports.getAllProfessionals = getAllProfessionals;
// Obter um profissional específico pelo ID
const getProfessionalById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // Validar formato do ID
    if (!isValidUUID(id)) {
        res.status(400).json({ message: "Formato de ID inválido." });
        return; // Return void
    }
    try {
        const professional = yield professionalRepository_1.professionalRepository.findById(id);
        if (!professional) {
            res.status(404).json({ message: "Profissional não encontrado" });
            return; // Return void
        }
        res.json(professional);
    }
    catch (error) {
        console.error(`Erro ao buscar profissional ${id}:`, error);
        next(error); // Use next for errors
    }
});
exports.getProfessionalById = getProfessionalById;
// Criar um novo profissional
const createProfessional = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Extrair dados do corpo da requisição, incluindo serviceIds
    const { name, role, image, companyId, serviceIds } = req.body;
    // Validação básica (melhor feita com express-validator, mas mantendo aqui por enquanto)
    if (!name || !role || !companyId) {
        res.status(400).json({ message: "Nome, cargo e ID da empresa são obrigatórios" });
        return;
    }
    if (!isValidUUID(companyId)) {
        res.status(400).json({ message: "Formato de ID da empresa inválido." });
        return;
    }
    if (serviceIds !== undefined) {
        if (!Array.isArray(serviceIds)) {
            res.status(400).json({ message: "serviceIds deve ser um array." });
            return;
        }
        if (!serviceIds.every(isValidUUID)) {
            res.status(400).json({ message: "Um ou mais serviceIds possuem formato inválido." });
            return;
        }
    }
    try {
        const dataToCreate = {
            name,
            role,
            image: image,
            company: { connect: { id: companyId } },
        };
        const newProfessional = yield professionalRepository_1.professionalRepository.create(dataToCreate, serviceIds);
        res.status(201).json(newProfessional);
    }
    catch (error) {
        console.error("Erro ao criar profissional:", error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2003" && ((_a = error.meta) === null || _a === void 0 ? void 0 : _a.field_name) === "Professional_companyId_fkey (index)") {
                res.status(400).json({ message: "ID da empresa inválido." });
                return;
            }
            if (error.code === "P2025") {
                res.status(400).json({ message: "Um ou mais IDs de serviço fornecidos são inválidos." });
                return;
            }
        }
        next(error); // Use next for other errors
    }
});
exports.createProfessional = createProfessional;
// Atualizar um profissional existente
const updateProfessional = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!isValidUUID(id)) {
        res.status(400).json({ message: "Formato de ID inválido." });
        return;
    }
    const _a = req.body, { companyId, serviceIds } = _a, dataToUpdate = __rest(_a, ["companyId", "serviceIds"]);
    if (serviceIds !== undefined) {
        if (!Array.isArray(serviceIds)) {
            res.status(400).json({ message: "serviceIds deve ser um array." });
            return;
        }
        if (!serviceIds.every(isValidUUID)) {
            res.status(400).json({ message: "Um ou mais serviceIds possuem formato inválido." });
            return;
        }
    }
    try {
        const updatedProfessional = yield professionalRepository_1.professionalRepository.update(id, dataToUpdate, serviceIds);
        if (!updatedProfessional) {
            res.status(404).json({ message: "Profissional não encontrado para atualização" });
            return;
        }
        res.json(updatedProfessional);
    }
    catch (error) {
        console.error(`Erro ao atualizar profissional ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "Profissional ou um dos serviços associados não encontrado." });
            return;
        }
        next(error); // Use next for other errors
    }
});
exports.updateProfessional = updateProfessional;
// Deletar um profissional
const deleteProfessional = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!isValidUUID(id)) {
        res.status(400).json({ message: "Formato de ID inválido." });
        return;
    }
    try {
        const deletedProfessional = yield professionalRepository_1.professionalRepository.delete(id);
        if (!deletedProfessional) {
            res.status(404).json({ message: "Profissional não encontrado para exclusão" });
            return;
        }
        // Changed to 204 No Content for successful deletion without returning body
        res.status(204).send();
    }
    catch (error) {
        console.error(`Erro ao deletar profissional ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
            res.status(409).json({ message: "Não é possível excluir o profissional pois existem registros associados que impedem a exclusão." });
            return;
        }
        next(error); // Use next for other errors
    }
});
exports.deleteProfessional = deleteProfessional;
// Add Service to Professional (Placeholder - needs implementation in repository)
const addServiceToProfessional = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO: Implement logic to associate service with professional
    res.status(501).json({ message: "Not Implemented" });
});
exports.addServiceToProfessional = addServiceToProfessional;
// Remove Service from Professional (Placeholder - needs implementation in repository)
const removeServiceFromProfessional = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO: Implement logic to disassociate service from professional
    res.status(501).json({ message: "Not Implemented" });
});
exports.removeServiceFromProfessional = removeServiceFromProfessional;
