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
exports.deleteProfessional = exports.updateProfessional = exports.createProfessional = exports.getProfessionalById = exports.getAllProfessionals = void 0;
const professionalRepository_1 = require("../repositories/professionalRepository");
const client_1 = require("@prisma/client");
// Obter todos os profissionais (opcionalmente filtrados por companyId)
const getAllProfessionals = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyId } = req.query;
    try {
        const professionals = yield professionalRepository_1.professionalRepository.getAll(companyId);
        return res.json(professionals);
    }
    catch (error) {
        console.error("Erro ao buscar profissionais:", error);
        return res.status(500).json({ message: "Erro interno do servidor" });
    }
});
exports.getAllProfessionals = getAllProfessionals;
// Obter um profissional específico pelo ID
const getProfessionalById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const professional = yield professionalRepository_1.professionalRepository.findById(id);
        if (!professional) {
            return res.status(404).json({ message: "Profissional não encontrado" });
        }
        return res.json(professional);
    }
    catch (error) {
        console.error(`Erro ao buscar profissional ${id}:`, error);
        return res.status(500).json({ message: "Erro interno do servidor" });
    }
});
exports.getProfessionalById = getProfessionalById;
// Criar um novo profissional
const createProfessional = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Extrair dados do corpo da requisição
    const { name, role, image, companyId } = req.body;
    // Validação básica
    if (!name || !role || !companyId) {
        return res.status(400).json({ message: "Nome, cargo e ID da empresa são obrigatórios" });
    }
    try {
        // Montar o objeto de dados para o Prisma usando 'connect'
        const dataToCreate = {
            name,
            role,
            image: image, // image é opcional
            company: { connect: { id: companyId } },
            // rating e appointments são definidos por padrão no schema
        };
        const newProfessional = yield professionalRepository_1.professionalRepository.create(dataToCreate);
        // TODO: Implementar lógica para conectar a serviços (ProfessionalService) após criar o profissional.
        return res.status(201).json(newProfessional);
    }
    catch (error) {
        console.error("Erro ao criar profissional:", error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
            // Verificar se a FK violada foi companyId
            if (((_a = error.meta) === null || _a === void 0 ? void 0 : _a.field_name) === "Professional_companyId_fkey (index)") {
                return res.status(400).json({ message: "ID da empresa inválido." });
            }
            return res.status(400).json({ message: "Erro de chave estrangeira ao criar profissional." });
        }
        return res.status(500).json({ message: "Erro interno do servidor" });
    }
});
exports.createProfessional = createProfessional;
// Atualizar um profissional existente
const updateProfessional = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // Não permitir atualização do companyId via este endpoint
    const _a = req.body, { companyId } = _a, dataToUpdate = __rest(_a, ["companyId"]);
    try {
        const updatedProfessional = yield professionalRepository_1.professionalRepository.update(id, dataToUpdate);
        if (!updatedProfessional) {
            return res.status(404).json({ message: "Profissional não encontrado para atualização" });
        }
        // TODO: Implementar lógica para atualizar/conectar serviços.
        return res.json(updatedProfessional);
    }
    catch (error) {
        console.error(`Erro ao atualizar profissional ${id}:`, error);
        return res.status(500).json({ message: "Erro interno do servidor" });
    }
});
exports.updateProfessional = updateProfessional;
// Deletar um profissional
const deleteProfessional = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const deletedProfessional = yield professionalRepository_1.professionalRepository.delete(id);
        if (!deletedProfessional) {
            return res.status(404).json({ message: "Profissional não encontrado para exclusão" });
        }
        return res.status(200).json({ message: "Profissional excluído com sucesso", professional: deletedProfessional });
    }
    catch (error) {
        console.error(`Erro ao deletar profissional ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
            return res.status(409).json({ message: "Não é possível excluir o profissional pois existem registros associados (ex: agendamentos, avaliações)." });
        }
        return res.status(500).json({ message: "Erro interno do servidor" });
    }
});
exports.deleteProfessional = deleteProfessional;
