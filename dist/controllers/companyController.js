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
exports.deleteCompany = exports.updateCompany = exports.createCompany = exports.getCompanyById = exports.getAllCompanies = void 0;
const companyRepository_1 = require("../repositories/companyRepository");
// Obter todas as empresas
const getAllCompanies = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const companies = yield companyRepository_1.companyRepository.getAll();
        res.json(companies);
    }
    catch (error) {
        next(error); // Passa o erro para o middleware global
    }
});
exports.getAllCompanies = getAllCompanies;
// Obter uma empresa específica pelo ID
const getCompanyById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // A validação do formato do ID será feita pelo express-validator
    try {
        const company = yield companyRepository_1.companyRepository.findById(id);
        if (!company) {
            // Lança um erro que será capturado pelo middleware global
            const error = new Error("Empresa não encontrada");
            error.statusCode = 404;
            return next(error);
        }
        res.json(company);
    }
    catch (error) {
        next(error);
    }
});
exports.getCompanyById = getCompanyById;
// Criar uma nova empresa
const createCompany = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // A validação dos dados (empresa e endereço) será feita pelo express-validator
    const _a = req.body, { address } = _a, companyData = __rest(_a, ["address"]);
    try {
        // Passar dados da empresa e do endereço separadamente para o repositório
        const newCompany = yield companyRepository_1.companyRepository.create(companyData, address);
        res.status(201).json(newCompany);
    }
    catch (error) {
        // Erros, incluindo P2002 (duplicidade), serão tratados pelo middleware global
        next(error);
    }
});
exports.createCompany = createCompany;
// Atualizar uma empresa existente
const updateCompany = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // A validação do formato do ID e dos dados do body será feita pelo express-validator
    const _a = req.body, { address } = _a, companyData = __rest(_a, ["address"]);
    try {
        // Passar dados da empresa e do endereço separadamente para o repositório
        const updatedCompany = yield companyRepository_1.companyRepository.update(id, companyData, address);
        // O repositório deve lançar um erro se a empresa não for encontrada (Prisma P2025)
        // que será tratado pelo middleware global
        res.json(updatedCompany);
    }
    catch (error) {
        // Erros, incluindo P2025 (não encontrado) ou P2002 (duplicidade), serão tratados pelo middleware global
        next(error);
    }
});
exports.updateCompany = updateCompany;
// Deletar uma empresa
const deleteCompany = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // A validação do formato do ID será feita pelo express-validator
    try {
        const deletedCompany = yield companyRepository_1.companyRepository.delete(id);
        // O repositório deve lançar um erro se a empresa não for encontrada (Prisma P2025)
        // que será tratado pelo middleware global
        res.status(200).json({ message: "Empresa excluída com sucesso", company: deletedCompany });
    }
    catch (error) {
        // Erros, incluindo P2025 (não encontrado) ou P2003 (restrição FK), serão tratados pelo middleware global
        next(error);
    }
});
exports.deleteCompany = deleteCompany;
