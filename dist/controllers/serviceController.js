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
exports.deleteServiceHandler = exports.updateServiceHandler = exports.createServiceHandler = exports.getServiceByIdHandler = exports.getAllServicesHandler = exports.loadExistingServiceMiddleware = exports.checkAdminOrCompanyOwnerMiddleware = exports.checkAdminRoleMiddleware = void 0;
const serviceRepository_1 = require("../repositories/serviceRepository");
const client_1 = require("@prisma/client"); // Added UserRole
// Helper function for UUID validation
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
};
// Middleware for authorization check (Admin only for now)
// TODO: Refactor into a dedicated middleware file and add Company Owner check
const checkAdminRoleMiddleware = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== client_1.UserRole.ADMIN) {
        res.status(403).json({ message: "Acesso negado. Somente administradores podem realizar esta ação." });
        return; // Stop execution
    }
    next();
};
exports.checkAdminRoleMiddleware = checkAdminRoleMiddleware;
// Middleware to check if user is Admin or owns the company associated with the service
// TODO: Implement this properly when Company has an ownerId
const checkAdminOrCompanyOwnerMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const companyId = req.params.companyId || req.body.companyId || ((_a = req.existingService) === null || _a === void 0 ? void 0 : _a.companyId);
    if (!companyId) {
        // This should ideally not happen if routes/logic are correct
        res.status(400).json({ message: "ID da empresa não encontrado para verificação de permissão." });
        return;
    }
    if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === client_1.UserRole.ADMIN) {
        next(); // Admin can do anything
        return; // Stop execution
    }
    // Placeholder for owner check
    // const company = await companyRepository.findById(companyId);
    // if (company && company.ownerId === req.user?.id) {
    //     next();
    //     return;
    // }
    res.status(403).json({ message: "Acesso negado. Permissão insuficiente." });
    // No return needed here as response is sent
});
exports.checkAdminOrCompanyOwnerMiddleware = checkAdminOrCompanyOwnerMiddleware;
// Middleware to load existing service for update/delete routes
const loadExistingServiceMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!isValidUUID(id)) {
        res.status(400).json({ message: "Formato de ID inválido." });
        return; // Stop execution
    }
    try {
        const existingService = yield serviceRepository_1.serviceRepository.findById(id);
        if (!existingService) {
            res.status(404).json({ message: `Serviço com ID ${id} não encontrado.` });
            return; // Stop execution
        }
        // Store service for later use in the main handler
        req.existingService = existingService;
        next(); // Proceed to the next middleware (authorization check)
    }
    catch (error) {
        next(error);
    }
});
exports.loadExistingServiceMiddleware = loadExistingServiceMiddleware;
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
const getAllServicesHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyId, category, q, minPrice, maxPrice, sort, page = "1", limit = "10" } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
        res.status(400).json({ message: "Parâmetros de paginação inválidos (page e limit devem ser números positivos)." });
        return; // Stop execution
    }
    const skip = (pageNum - 1) * limitNum;
    try {
        const filters = {};
        if (companyId && typeof companyId === 'string' && isValidUUID(companyId))
            filters.companyId = companyId;
        if (category) {
            // Assuming category query param is the ID now
            const categoryIdNum = parseInt(category, 10);
            if (!isNaN(categoryIdNum)) {
                filters.categoryId = categoryIdNum; // Use categoryId for filtering
            }
            else {
                console.warn("Invalid category ID provided: ", category);
                // Optionally return error or ignore filter
                // res.status(400).json({ message: "Formato de categoryId inválido." });
                // return;
            }
        }
        if (q) {
            const searchTerm = q;
            filters.OR = [
                { name: { contains: searchTerm, mode: "insensitive" } },
                { description: { contains: searchTerm, mode: "insensitive" } },
            ];
        }
        const minPriceDecimal = parseDecimal(minPrice);
        const maxPriceDecimal = parseDecimal(maxPrice);
        if (minPriceDecimal !== undefined && maxPriceDecimal !== undefined) {
            if (minPriceDecimal.greaterThan(maxPriceDecimal)) {
                res.status(400).json({ message: "minPrice não pode ser maior que maxPrice." });
                return; // Stop execution
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
            return; // Stop execution
        }
        else {
            console.error("Error fetching services:", error);
            next(error);
        }
    }
});
exports.getAllServicesHandler = getAllServicesHandler;
// Obter um serviço específico pelo ID - Public
const getServiceByIdHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!isValidUUID(id)) {
        res.status(400).json({ message: "Formato de ID inválido." });
        return; // Stop execution
    }
    try {
        const service = yield serviceRepository_1.serviceRepository.findById(id);
        if (!service) {
            res.status(404).json({ message: "Serviço não encontrado" });
            return; // Stop execution
        }
        res.json(service);
    }
    catch (error) {
        next(error);
    }
});
exports.getServiceByIdHandler = getServiceByIdHandler;
// Criar um novo serviço - Requires ADMIN (or Company Owner)
// This is the main handler function, separated from middlewares
const createServiceHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Extract data from request body
    const { name, description, price, duration, image, categoryId, companyId } = req.body;
    // --- Input Validation (already done by express-validator, but keep basic checks) ---
    if (!name || !description || price === undefined || !duration || !categoryId || !companyId) {
        res.status(400).json({ message: "Campos obrigatórios ausentes (name, description, price, duration, categoryId, companyId)." });
        return; // Stop execution
    }
    if (!isValidUUID(companyId)) {
        res.status(400).json({ message: "Formato de companyId inválido." });
        return; // Stop execution
    }
    const priceDecimal = parseDecimal(price);
    if (priceDecimal === undefined) {
        res.status(400).json({ message: "Formato de preço inválido. Use um número decimal." });
        return; // Stop execution
    }
    // Validate categoryId is a number
    const categoryIdNum = parseInt(categoryId, 10);
    if (isNaN(categoryIdNum)) {
        res.status(400).json({ message: "categoryId inválido. Deve ser um número." });
        return; // Stop execution
    }
    // --- End Input Validation ---
    try {
        // Authorization check (already done by middleware)
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
                res.status(400).json({ message: `Erro ao conectar: ${cause || 'Registro relacionado não encontrado (Empresa ou Categoria)'}` });
                return; // Stop execution
            }
        }
        next(error);
    }
});
exports.createServiceHandler = createServiceHandler;
// Atualizar um serviço existente - Requires ADMIN (or Company Owner)
// This is the main handler function, separated from middlewares
const updateServiceHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    // Extract data from request body
    const _b = req.body, { name, description, price, duration, image, categoryId, companyId } = _b, otherData = __rest(_b, ["name", "description", "price", "duration", "image", "categoryId", "companyId"]);
    // Retrieve existing service stored by middleware
    const existingService = req.existingService; // Already loaded and typed
    if (!existingService) {
        // Should have been caught by loadExistingServiceMiddleware, but double-check
        res.status(404).json({ message: `Serviço com ID ${id} não encontrado.` });
        return;
    }
    try {
        // Build the update payload selectively
        const updatePayload = {};
        if (name !== undefined)
            updatePayload.name = name;
        if (description !== undefined)
            updatePayload.description = description;
        if (duration !== undefined)
            updatePayload.duration = duration;
        if (image !== undefined)
            updatePayload.image = image;
        // Include any other valid fields from otherData if necessary
        // Object.assign(updatePayload, otherData); // Be careful with this
        if (price !== undefined) {
            const priceDecimal = parseDecimal(price);
            if (priceDecimal === undefined) {
                res.status(400).json({ message: "Formato de preço inválido. Use um número decimal." });
                return; // Stop execution
            }
            updatePayload.price = priceDecimal;
        }
        if (categoryId !== undefined) {
            // Validate categoryId is a number
            const categoryIdNum = parseInt(categoryId, 10);
            if (isNaN(categoryIdNum)) {
                res.status(400).json({ message: "categoryId inválido. Deve ser um número." });
                return; // Stop execution
            }
            updatePayload.category = { connect: { id: categoryIdNum } }; // Use parsed number
        }
        // Prevent changing the company
        if (companyId !== undefined && companyId !== existingService.companyId) {
            res.status(400).json({ message: "Não é permitido alterar a empresa de um serviço existente." });
            return; // Stop execution
        }
        // Check if there's anything to update
        if (Object.keys(updatePayload).length === 0) {
            res.status(400).json({ message: "Nenhum dado fornecido para atualização." });
            return; // Stop execution
        }
        const updatedService = yield serviceRepository_1.serviceRepository.update(id, updatePayload);
        res.json(updatedService);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            // Access meta property safely
            const cause = (_a = error.meta) === null || _a === void 0 ? void 0 : _a.cause;
            if (error.code === 'P2025') {
                res.status(404).json({ message: `Erro ao atualizar: ${cause || 'Registro relacionado não encontrado (Categoria)'}` });
                return; // Stop execution
            }
        }
        next(error);
    }
});
exports.updateServiceHandler = updateServiceHandler;
// Deletar um serviço - Requires ADMIN (or Company Owner)
// This is the main handler function, separated from middlewares
const deleteServiceHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // Authorization already checked by middleware
    try {
        const deletedService = yield serviceRepository_1.serviceRepository.delete(id);
        res.status(200).json({ message: "Serviço excluído com sucesso", service: deletedService });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: `Serviço com ID ${id} não encontrado.` });
            return; // Stop execution
        }
        next(error);
    }
});
exports.deleteServiceHandler = deleteServiceHandler;
