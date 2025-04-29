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
exports.deleteCompany = exports.updateCompany = exports.createCompany = exports.getCompanyById = exports.getAllCompanies = void 0;
const companyRepository_1 = require("../repositories/companyRepository");
const client_1 = require("@prisma/client"); // Revertido: Importar de @prisma/client
// Obter todas as empresas
const getAllCompanies = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const companies = yield companyRepository_1.companyRepository.getAll();
        return res.json(companies);
    }
    catch (error) {
        console.error("Erro ao buscar empresas:", error);
        return res.status(500).json({ message: "Erro interno do servidor" });
    }
});
exports.getAllCompanies = getAllCompanies;
// Obter uma empresa específica pelo ID
const getCompanyById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const company = yield companyRepository_1.companyRepository.findById(id);
        if (!company) {
            return res.status(404).json({ message: "Empresa não encontrada" });
        }
        return res.json(company);
    }
    catch (error) {
        console.error(`Erro ao buscar empresa ${id}:`, error);
        return res.status(500).json({ message: "Erro interno do servidor" });
    }
});
exports.getCompanyById = getCompanyById;
// Criar uma nova empresa
const createCompany = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const data = req.body;
    // Validação básica
    if (!data.name || !data.email) {
        return res.status(400).json({ message: "Nome e email são obrigatórios" });
    }
    // TODO: Adicionar validação mais robusta (ex: formato de email, telefone)
    // TODO: Tratar a criação do endereço associado (data.address)
    try {
        const newCompany = yield companyRepository_1.companyRepository.create(data);
        return res.status(201).json(newCompany);
    }
    catch (error) {
        console.error("Erro ao criar empresa:", error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            // Verificar qual campo causou a violação (ex: email)
            if (((_a = error.meta) === null || _a === void 0 ? void 0 : _a.target) === 'Company_email_key') {
                return res.status(409).json({ message: "Email já cadastrado para outra empresa." });
            }
            return res.status(409).json({ message: "Erro de conflito ao criar empresa (possível duplicidade)." });
        }
        return res.status(500).json({ message: "Erro interno do servidor" });
    }
});
exports.createCompany = createCompany;
// Atualizar uma empresa existente
const updateCompany = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const data = req.body;
    // TODO: Tratar a atualização do endereço associado (data.address)
    try {
        const updatedCompany = yield companyRepository_1.companyRepository.update(id, data);
        if (!updatedCompany) {
            return res.status(404).json({ message: "Empresa não encontrada para atualização" });
        }
        return res.json(updatedCompany);
    }
    catch (error) {
        console.error(`Erro ao atualizar empresa ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(409).json({ message: "Erro de conflito ao atualizar empresa (possível duplicidade de email)." });
        }
        // O erro P2025 (Not Found) já é tratado pelo retorno null do repositório
        return res.status(500).json({ message: "Erro interno do servidor" });
    }
});
exports.updateCompany = updateCompany;
// Deletar uma empresa
const deleteCompany = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        // O repositório já deve lidar com a exclusão em cascata ou manual do endereço, se configurado
        const deletedCompany = yield companyRepository_1.companyRepository.delete(id);
        if (!deletedCompany) {
            return res.status(404).json({ message: "Empresa não encontrada para exclusão" });
        }
        return res.status(200).json({ message: "Empresa excluída com sucesso", company: deletedCompany });
    }
    catch (error) {
        console.error(`Erro ao deletar empresa ${id}:`, error);
        // O erro P2025 (Not Found) já é tratado pelo retorno null do repositório
        // Tratar outros erros potenciais (ex: P2003 - Foreign key constraint, se houver dependências não tratadas)
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return res.status(409).json({ message: "Não é possível excluir a empresa pois existem registros associados (ex: profissionais, serviços)." });
        }
        return res.status(500).json({ message: "Erro interno do servidor" });
    }
});
exports.deleteCompany = deleteCompany;
