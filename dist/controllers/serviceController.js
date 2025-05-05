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
// Helper function for UUID validation
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
};
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
        // Return the response directly
        return res.status(400).json({ message: "Parâmetros de paginação inválidos (page e limit devem ser números positivos)." });
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
                // return res.status(400).json({ message: "Formato de categoryId inválido." });
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
                // Return the response directly
                return res.status(400).json({ message: "minPrice não pode ser maior que maxPrice." });
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
        // Return the response
        return res.json({
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
            // Return the response directly
            return res.status(400).json({ message: "Erro de validação nos dados fornecidos.", details: error.message });
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
    if (!isValidUUID(id)) {
        return res.status(400).json({ message: "Formato de ID inválido." });
    }
    try {
        const service = yield serviceRepository_1.serviceRepository.findById(id);
        if (!service) {
            // Use return to stop execution after sending response
            return res.status(404).json({ message: "Serviço não encontrado" });
        }
        // Return the response
        return res.json(service);
    }
    catch (error) {
        next(error);
    }
});
exports.getServiceById = getServiceById;
// Criar um novo serviço - Requires ADMIN (or Company Owner)
exports.createService = [
    checkAdminRole, // Apply admin check middleware first
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        // Extract data from request body
        const { name, description, price, duration, image, categoryId, companyId } = req.body;
        // --- Input Validation ---
        if (!name || !description || price === undefined || !duration || !categoryId || !companyId) {
            return res.status(400).json({ message: "Campos obrigatórios ausentes (name, description, price, duration, categoryId, companyId)." });
        }
        if (!isValidUUID(companyId)) {
            return res.status(400).json({ message: "Formato de companyId inválido." });
        }
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
        // --- End Input Validation ---
        try {
            // Authorization check (placeholder for company owner)
            // await checkAdminOrCompanyOwner(req, res, next, companyId); // Call this if needed
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
            // Return the response
            return res.status(201).json(newService);
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
    // Middleware to check Admin or Company Owner based on the service being updated
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        if (!isValidUUID(id)) {
            return res.status(400).json({ message: "Formato de ID inválido." });
        }
        try {
            const existingService = yield serviceRepository_1.serviceRepository.findById(id);
            if (!existingService) {
                return res.status(404).json({ message: `Serviço com ID ${id} não encontrado.` });
            }
            // Store service for later use in the main handler
            req.existingService = existingService;
            // Check authorization based on the service's company
            yield checkAdminOrCompanyOwner(req, res, next, existingService.companyId);
        }
        catch (error) {
            next(error);
        }
    }),
    // Main handler
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const { id } = req.params;
        // Extract data from request body
        const _b = req.body, { name, description, price, duration, image, categoryId, companyId } = _b, otherData = __rest(_b, ["name", "description", "price", "duration", "image", "categoryId", "companyId"]);
        // Retrieve existing service stored by middleware
        const existingService = req.existingService;
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
            // Prevent changing the company
            if (companyId !== undefined && companyId !== existingService.companyId) {
                // Use return
                return res.status(400).json({ message: "Não é permitido alterar a empresa de um serviço existente." });
            }
            // Check if there's anything to update
            if (Object.keys(updatePayload).length === 0) {
                return res.status(400).json({ message: "Nenhum dado fornecido para atualização." });
            }
            const updatedService = yield serviceRepository_1.serviceRepository.update(id, updatePayload);
            // Return the response
            return res.json(updatedService);
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
    // Middleware to check Admin or Company Owner based on the service being deleted
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        if (!isValidUUID(id)) {
            return res.status(400).json({ message: "Formato de ID inválido." });
        }
        try {
            const existingService = yield serviceRepository_1.serviceRepository.findById(id);
            if (!existingService) {
                // Allow delete attempt even if not found, repo handles P2025
                // return res.status(404).json({ message: `Serviço com ID ${id} não encontrado.` });
            }
            // Check authorization based on the service's company (if it exists)
            yield checkAdminOrCompanyOwner(req, res, next, (existingService === null || existingService === void 0 ? void 0 : existingService.companyId) || ''); // Pass empty string if no companyId
        }
        catch (error) {
            next(error);
        }
    }),
    // Main handler
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const deletedService = yield serviceRepository_1.serviceRepository.delete(id);
            // Return the response
            return res.status(200).json({ message: "Serviço excluído com sucesso", service: deletedService });
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
