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
const client_1 = require("@prisma/client"); // Added UserRole
// Helper function for authorization check (Admin only for now)
// TODO: Refactor into middleware and add Company Owner check
const checkAdminRole = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== client_1.UserRole.ADMIN) {
        return res.status(403).json({ message: "Acesso negado. Somente administradores podem realizar esta ação." });
    }
    next();
};
// Helper function to check if user is Admin or owns the company associated with the service
// TODO: Implement this properly when Company has an ownerId
const checkAdminOrCompanyOwner = (req, res, next, companyId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === client_1.UserRole.ADMIN) {
        return next(); // Admin can do anything
    }
    // Placeholder for owner check
    // const company = await companyRepository.findById(companyId);
    // if (company && company.ownerId === req.user?.id) {
    //     return next();
    // }
    return res.status(403).json({ message: "Acesso negado. Permissão insuficiente." });
});
// Helper function to parse decimal strings
const parseDecimal = (value) => {
    if (value === null || value === undefined)
        return undefined;
    try {
        // Ensure value is treated as string before passing to Decimal constructor if needed
        return new client_1.Prisma.Decimal(String(value));
    }
    catch (e) {
        return undefined; // Invalid decimal format
    }
};
// Obter todos os serviços (com filtros e paginação) - Public
const getAllServices = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyId, category, q, minPrice, maxPrice, sort, page = "1", limit = "10" } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
        res.status(400).json({ message: "Parâmetros de paginação inválidos (page e limit devem ser números positivos)." });
        return;
    }
    const skip = (pageNum - 1) * limitNum;
    try {
        const filters = {};
        if (companyId)
            filters.companyId = companyId; // Cast companyId to string
        if (category) {
            // Assuming category query param is the ID now
            const categoryIdNum = parseInt(category, 10);
            if (!isNaN(categoryIdNum)) {
                filters.categoryId = categoryIdNum; // Use categoryId for filtering
            }
            else {
                // Fallback to name search if needed, but ID is preferred
                // filters.category = { name: { contains: category as string, mode: "insensitive" } }; // Removed category name filter for simplicity/consistency
                console.warn("Invalid category ID provided, filtering by category name is not supported currently.");
            }
        }
        if (q) {
            const searchTerm = q;
            filters.OR = [
                { name: { contains: searchTerm, mode: "insensitive" } },
                { description: { contains: searchTerm, mode: "insensitive" } },
                // { category: { name: { contains: searchTerm, mode: "insensitive" } } }, // Filter by category name removed
                // { company: { name: { contains: searchTerm, mode: "insensitive" } } }, // Filter by company name removed for simplicity
            ];
        }
        const minPriceDecimal = parseDecimal(minPrice);
        const maxPriceDecimal = parseDecimal(maxPrice);
        if (minPriceDecimal !== undefined && maxPriceDecimal !== undefined) {
            if (minPriceDecimal.greaterThan(maxPriceDecimal)) {
                res.status(400).json({ message: "minPrice não pode ser maior que maxPrice." });
                return;
            }
            filters.price = { gte: minPriceDecimal, lte: maxPriceDecimal };
        }
        else if (minPriceDecimal !== undefined) {
            filters.price = { gte: minPriceDecimal };
        }
        else if (maxPriceDecimal !== undefined) {
            filters.price = { lte: maxPriceDecimal };
        }
        let orderBy = { name: "asc" }; // Default sort
        switch (sort) {
            case "price_asc":
                orderBy = { price: "asc" };
                break;
            case "price_desc":
                orderBy = { price: "desc" };
                break;
            case "name_asc":
                orderBy = { name: "asc" };
                break;
        }
        const services = yield serviceRepository_1.serviceRepository.findMany(filters, orderBy, skip, limitNum);
        const totalServices = yield serviceRepository_1.serviceRepository.count(filters);
        res.json({
            data: services,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalServices / limitNum),
                totalItems: totalServices,
                itemsPerPage: limitNum,
            },
        });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientValidationError) {
            console.error("Prisma Validation Error:", error.message);
            res.status(400).json({ message: "Erro de validação nos dados fornecidos.", details: error.message });
        }
        else {
            console.error("Error fetching services:", error);
            next(error);
        }
    }
});
exports.getAllServices = getAllServices;
// Obter um serviço específico pelo ID - Public
const getServiceById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const service = yield serviceRepository_1.serviceRepository.findById(id);
        if (!service) {
            // Use return to stop execution after sending response
            return res.status(404).json({ message: "Serviço não encontrado" });
        }
        res.json(service);
    }
    catch (error) {
        next(error);
    }
});
exports.getServiceById = getServiceById;
// Criar um novo serviço - Requires ADMIN (or Company Owner)
exports.createService = [
    checkAdminRole,
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const { name, description, price, duration, image, categoryId, companyId } = req.body;
        const priceDecimal = parseDecimal(price);
        if (priceDecimal === undefined) {
            // Use return
            return res.status(400).json({ message: "Formato de preço inválido. Use um número decimal." });
        }
        // Validate categoryId is a number
        const categoryIdNum = parseInt(categoryId, 10);
        if (isNaN(categoryIdNum)) {
            // Use return
            return res.status(400).json({ message: "categoryId inválido. Deve ser um número." });
        }
        try {
            // Authorization check (handled by middleware)
            const dataToCreate = {
                name,
                description,
                price: priceDecimal,
                duration,
                image,
                category: { connect: { id: categoryIdNum } }, // Use parsed number
                company: { connect: { id: companyId } },
            };
            const newService = yield serviceRepository_1.serviceRepository.create(dataToCreate);
            res.status(201).json(newService);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                // Access meta property safely
                const cause = (_a = error.meta) === null || _a === void 0 ? void 0 : _a.cause;
                if (error.code === 'P2025') {
                    // Use return
                    return res.status(400).json({ message: `Erro ao conectar: ${cause || 'Registro relacionado não encontrado (Empresa ou Categoria)'}` });
                }
            }
            next(error);
        }
    })
];
// Atualizar um serviço existente - Requires ADMIN (or Company Owner)
exports.updateService = [
    checkAdminRole,
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const { id } = req.params;
        const _b = req.body, { companyId, categoryId, price } = _b, dataToUpdate = __rest(_b, ["companyId", "categoryId", "price"]);
        try {
            const existingService = yield serviceRepository_1.serviceRepository.findById(id);
            if (!existingService) {
                // Use return
                return res.status(404).json({ message: `Serviço com ID ${id} não encontrado.` });
            }
            // Authorization check (handled by middleware)
            const updatePayload = Object.assign({}, dataToUpdate);
            if (price !== undefined) {
                const priceDecimal = parseDecimal(price);
                if (priceDecimal === undefined) {
                    // Use return
                    return res.status(400).json({ message: "Formato de preço inválido. Use um número decimal." });
                }
                updatePayload.price = priceDecimal;
            }
            if (categoryId !== undefined) {
                // Validate categoryId is a number
                const categoryIdNum = parseInt(categoryId, 10);
                if (isNaN(categoryIdNum)) {
                    // Use return
                    return res.status(400).json({ message: "categoryId inválido. Deve ser um número." });
                }
                updatePayload.category = { connect: { id: categoryIdNum } }; // Use parsed number
            }
            if (companyId !== undefined && companyId !== existingService.companyId) {
                // Use return
                return res.status(400).json({ message: "Não é permitido alterar a empresa de um serviço existente." });
            }
            const updatedService = yield serviceRepository_1.serviceRepository.update(id, updatePayload);
            res.json(updatedService);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                // Access meta property safely
                const cause = (_a = error.meta) === null || _a === void 0 ? void 0 : _a.cause;
                if (error.code === 'P2025') {
                    // Use return
                    return res.status(404).json({ message: `Erro ao atualizar: ${cause || 'Registro relacionado não encontrado (Categoria)'}` });
                }
            }
            next(error);
        }
    })
];
// Deletar um serviço - Requires ADMIN (or Company Owner)
exports.deleteService = [
    checkAdminRole,
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const existingService = yield serviceRepository_1.serviceRepository.findById(id);
            if (!existingService) {
                // Use return
                return res.status(404).json({ message: `Serviço com ID ${id} não encontrado.` });
            }
            // Authorization check (handled by middleware)
            const deletedService = yield serviceRepository_1.serviceRepository.delete(id);
            res.status(200).json({ message: "Serviço excluído com sucesso", service: deletedService });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                // Use return
                return res.status(404).json({ message: `Serviço com ID ${id} não encontrado.` });
            }
            next(error);
        }
    })
];
