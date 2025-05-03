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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCompany = exports.updateCompany = exports.createCompany = exports.getCompanyById = exports.getAllCompanies = void 0;
const companyRepository_1 = __importDefault(require("../repositories/companyRepository")); // Corrected: default import
// Obter todas as empresas (com filtros e paginação)
const getAllCompanies = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Extrair filtros e paginação da query string
    const { q, // Search term
    category, // Filter by category (from categories array)
    city, state, minRating, sort, // e.g., "rating_desc", "name_asc"
    page = "1", // Default page 1
    limit = "10" // Default 10 items per page
     } = req.query;
    // Validar e converter parâmetros de paginação
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
        res.status(400).json({ message: "Parâmetros de paginação inválidos (page e limit devem ser números positivos)." });
        return;
    }
    const skip = (pageNum - 1) * limitNum;
    try {
        // Construir objeto de filtros para Prisma
        const filters = {};
        if (category)
            filters.categories = { has: category };
        if (q) {
            const searchTerm = q;
            filters.OR = [
                { name: { contains: searchTerm, mode: "insensitive" } },
                { description: { contains: searchTerm, mode: "insensitive" } },
                { categories: { has: searchTerm } },
                // Add search in address fields
                { address: { city: { contains: searchTerm, mode: "insensitive" } } },
                { address: { state: { contains: searchTerm, mode: "insensitive" } } },
            ];
        }
        // Corrected: Add location filters properly
        const addressFilter = {}; // Corrected type
        if (city)
            addressFilter.city = { contains: city, mode: "insensitive" };
        if (state)
            addressFilter.state = { contains: state, mode: "insensitive" };
        // Only add the address filter if city or state was provided
        if (Object.keys(addressFilter).length > 0) {
            filters.address = addressFilter;
        }
        // Add rating filter (schema has rating as Float)
        if (minRating) {
            const ratingNum = parseFloat(minRating);
            if (!isNaN(ratingNum)) {
                filters.rating = { gte: ratingNum };
            }
        }
        // Construir objeto de ordenação para Prisma
        let orderBy = {};
        switch (sort) {
            case "rating_desc":
                orderBy = { rating: "desc" };
                break;
            case "name_asc":
                orderBy = { name: "asc" };
                break;
            default:
                orderBy = { name: "asc" }; // Default sort
        }
        // Assume repository methods findMany and count exist
        const companies = yield companyRepository_1.default.findMany(filters, orderBy, skip, limitNum);
        const totalCompanies = yield companyRepository_1.default.count(filters);
        res.json({
            data: companies,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalCompanies / limitNum),
                totalItems: totalCompanies,
                itemsPerPage: limitNum,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllCompanies = getAllCompanies;
// Obter uma empresa específica pelo ID
const getCompanyById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const company = yield companyRepository_1.default.findById(id);
        if (!company) {
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
    const _a = req.body, { address } = _a, companyData = __rest(_a, ["address"]);
    try {
        if (companyData.categories && !Array.isArray(companyData.categories)) {
            companyData.categories = [companyData.categories];
        }
        const newCompany = yield companyRepository_1.default.create(companyData, address);
        res.status(201).json(newCompany);
    }
    catch (error) {
        next(error);
    }
});
exports.createCompany = createCompany;
// Atualizar uma empresa existente
const updateCompany = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const _a = req.body, { address } = _a, companyData = __rest(_a, ["address"]);
    try {
        if (companyData.categories && !Array.isArray(companyData.categories)) {
            companyData.categories = [companyData.categories];
        }
        if (companyData.rating !== undefined)
            companyData.rating = parseFloat(companyData.rating);
        if (companyData.totalReviews !== undefined)
            companyData.totalReviews = parseInt(companyData.totalReviews, 10);
        const updatedCompany = yield companyRepository_1.default.update(id, companyData, address);
        res.json(updatedCompany);
    }
    catch (error) {
        next(error);
    }
});
exports.updateCompany = updateCompany;
// Deletar uma empresa
const deleteCompany = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const deletedCompany = yield companyRepository_1.default.delete(id);
        res.status(200).json({ message: "Empresa excluída com sucesso", company: deletedCompany });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteCompany = deleteCompany;
