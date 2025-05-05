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
const client_1 = require("@prisma/client"); // Added UserRole
// Helper function for authorization check (can be moved to middleware later)
const checkAdminRole = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== client_1.UserRole.ADMIN) {
        return res.status(403).json({ message: "Acesso negado. Somente administradores podem realizar esta ação." });
    }
    next();
};
// Obter todas as empresas (com filtros e paginação) - Public or requires different auth?
const getAllCompanies = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { q, category, city, state, minRating, sort, page = "1", limit = "10" } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
        // Return the response directly
        return res.status(400).json({ message: "Parâmetros de paginação inválidos (page e limit devem ser números positivos)." });
    }
    const skip = (pageNum - 1) * limitNum;
    try {
        const filters = {};
        if (category)
            filters.categories = { has: category };
        if (q) {
            const searchTerm = q;
            filters.OR = [
                { name: { contains: searchTerm, mode: "insensitive" } },
                { description: { contains: searchTerm, mode: "insensitive" } },
                { categories: { has: searchTerm } },
                { address: { city: { contains: searchTerm, mode: "insensitive" } } },
                { address: { state: { contains: searchTerm, mode: "insensitive" } } },
            ];
        }
        const addressFilter = {};
        if (city)
            addressFilter.city = { contains: city, mode: "insensitive" };
        if (state)
            addressFilter.state = { contains: state, mode: "insensitive" };
        if (Object.keys(addressFilter).length > 0) {
            filters.address = addressFilter;
        }
        if (minRating) {
            const ratingNum = parseFloat(minRating);
            if (!isNaN(ratingNum)) {
                filters.rating = { gte: ratingNum };
            }
        }
        let orderBy = { name: "asc" }; // Default sort
        switch (sort) {
            case "rating_desc":
                orderBy = { rating: "desc" };
                break;
            case "name_asc":
                orderBy = { name: "asc" };
                break;
        }
        const companies = yield companyRepository_1.default.findMany(filters, orderBy, skip, limitNum);
        const totalCompanies = yield companyRepository_1.default.count(filters);
        // Return the response
        return res.json({
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
// Obter uma empresa específica pelo ID - Public or requires different auth?
const getCompanyById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const company = yield companyRepository_1.default.findById(id);
        if (!company) {
            // Return the response directly
            return res.status(404).json({ message: "Empresa não encontrada" });
        }
        // Return the response
        return res.json(company);
    }
    catch (error) {
        next(error);
    }
});
exports.getCompanyById = getCompanyById;
// Criar uma nova empresa - Requires ADMIN role
exports.createCompany = [
    checkAdminRole, // Add authorization check middleware
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const _a = req.body, { address } = _a, companyData = __rest(_a, ["address"]); // Destructure address and company data
        try {
            if (companyData.categories && !Array.isArray(companyData.categories)) {
                companyData.categories = [companyData.categories];
            }
            // TODO: Add ownerId based on req.user.id if schema changes
            const newCompany = yield companyRepository_1.default.create(companyData, address);
            // Return the response
            return res.status(201).json(newCompany);
        }
        catch (error) {
            next(error);
        }
    })
];
// Atualizar uma empresa existente - Requires ADMIN role (or owner)
exports.updateCompany = [
    checkAdminRole, // Add authorization check middleware (simplest approach for now)
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        const _a = req.body, { address } = _a, companyData = __rest(_a, ["address"]); // Destructure address and company data
        try {
            // TODO: Add check: if not ADMIN, verify req.user.id owns company with id `id`
            // Ensure company exists before attempting update (optional, repo might handle)
            const existingCompany = yield companyRepository_1.default.findById(id);
            if (!existingCompany) {
                // Return the response directly
                return res.status(404).json({ message: "Empresa não encontrada para atualização." });
            }
            // Authorization check (placeholder for ownership)
            // if (req.user?.role !== UserRole.ADMIN && existingCompany.ownerId !== req.user?.id) {
            //     return res.status(403).json({ message: "Acesso negado." });
            // }
            if (companyData.categories && !Array.isArray(companyData.categories)) {
                companyData.categories = [companyData.categories];
            }
            // Ensure rating and totalReviews are numbers if provided
            if (companyData.rating !== undefined)
                companyData.rating = parseFloat(companyData.rating);
            if (companyData.totalReviews !== undefined)
                companyData.totalReviews = parseInt(companyData.totalReviews, 10);
            const updatedCompany = yield companyRepository_1.default.update(id, companyData, address);
            // Return the response
            return res.json(updatedCompany);
        }
        catch (error) {
            // Handle Prisma P2025 specifically if repo doesn't
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                // Return the response directly
                return res.status(404).json({ message: "Empresa não encontrada para atualização." });
            }
            next(error);
        }
    })
];
// Deletar uma empresa - Requires ADMIN role (or owner)
exports.deleteCompany = [
    checkAdminRole, // Add authorization check middleware (simplest approach for now)
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            // TODO: Add check: if not ADMIN, verify req.user.id owns company with id `id`
            // Ensure company exists before attempting delete (optional, repo might handle)
            const existingCompany = yield companyRepository_1.default.findById(id);
            if (!existingCompany) {
                // Return the response directly
                return res.status(404).json({ message: "Empresa não encontrada para exclusão." });
            }
            // Authorization check (placeholder for ownership)
            // if (req.user?.role !== UserRole.ADMIN && existingCompany.ownerId !== req.user?.id) {
            //     return res.status(403).json({ message: "Acesso negado." });
            // }
            const deletedCompany = yield companyRepository_1.default.delete(id);
            // Repo delete might throw if not found, handle P2025 if needed
            // Return the response
            return res.status(200).json({ message: "Empresa excluída com sucesso", company: deletedCompany });
        }
        catch (error) {
            // Handle Prisma P2025 specifically if repo doesn't
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                // Return the response directly
                return res.status(404).json({ message: "Empresa não encontrada para exclusão." });
            }
            next(error);
        }
    })
];
