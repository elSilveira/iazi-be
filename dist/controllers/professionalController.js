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
exports.removeServiceFromProfessionalHandler = exports.addServiceToProfessionalHandler = exports.deleteProfessionalHandler = exports.updateProfessionalHandler = exports.createProfessionalHandler = exports.getProfessionalByIdHandler = exports.getAllProfessionalsHandler = exports.checkAdminOrCompanyOwnerMiddleware = exports.checkAdminRoleMiddleware = void 0;
const professionalRepository_1 = require("../repositories/professionalRepository");
const client_1 = require("@prisma/client"); // Added UserRole
// --- Authorization Helpers (Consider moving to middleware) ---
// Middleware for Admin check
const checkAdminRoleMiddleware = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== client_1.UserRole.ADMIN) {
        res.status(403).json({ message: "Acesso negado. Somente administradores podem realizar esta ação." });
        return; // Stop execution
    }
    next();
};
exports.checkAdminRoleMiddleware = checkAdminRoleMiddleware;
// Middleware to check if user is Admin or owns the company
// Assumes Company model has an ownerId field linked to the User model
const checkAdminOrCompanyOwnerMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let companyId = req.params.companyId || req.body.companyId;
    // If checking for an existing professional, get companyId from them
    if (req.params.id && !companyId) {
        try {
            const professional = yield professionalRepository_1.professionalRepository.findById(req.params.id);
            companyId = professional === null || professional === void 0 ? void 0 : professional.companyId;
        }
        catch (error) {
            // Handle error if professional not found or other DB issue
            return next(error);
        }
    }
    if (!companyId) {
        // If no companyId is involved (e.g., creating a professional without a company initially), only admin can do it?
        // Or adjust logic based on requirements. For now, restrict to Admin.
        return (0, exports.checkAdminRoleMiddleware)(req, res, next);
    }
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === client_1.UserRole.ADMIN) {
        return next(); // Admin can do anything
    }
    try {
        // Fetch the company to check its owner
        // const company = await companyRepository.findById(companyId);
        // if (company && company.ownerId === req.user?.id) { // Assuming ownerId exists
        //     return next();
        // }
        // Placeholder: Since ownerId is not in the schema, restrict to Admin for now
        res.status(403).json({ message: "Acesso negado. Permissão insuficiente (Admin or Company Owner required)." });
        // No return needed here as response is sent
    }
    catch (error) {
        next(error);
    }
});
exports.checkAdminOrCompanyOwnerMiddleware = checkAdminOrCompanyOwnerMiddleware;
// Helper function for UUID validation
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
};
// Obter todos os profissionais (com filtros e paginação) - Public
const getAllProfessionalsHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyId, q, role, serviceId, city, state, minRating, sort, page = "1", limit = "10" } = req.query;
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
        if (role)
            filters.role = { contains: role, mode: "insensitive" };
        if (serviceId && typeof serviceId === 'string' && isValidUUID(serviceId)) {
            filters.services = {
                some: { serviceId: serviceId }
            };
        }
        if (q) {
            const searchTerm = q;
            filters.OR = [
                { name: { contains: searchTerm, mode: "insensitive" } },
                { role: { contains: searchTerm, mode: "insensitive" } },
                { company: { name: { contains: searchTerm, mode: "insensitive" } } },
                { services: { some: { service: { name: { contains: searchTerm, mode: "insensitive" } } } } },
            ];
        }
        const companyFilter = {};
        const addressFilter = {};
        if (city)
            addressFilter.city = { contains: city, mode: "insensitive" };
        if (state)
            addressFilter.state = { contains: state, mode: "insensitive" };
        if (Object.keys(addressFilter).length > 0) {
            companyFilter.address = addressFilter;
            filters.company = companyFilter;
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
        const professionals = yield professionalRepository_1.professionalRepository.findMany(filters, orderBy, skip, limitNum);
        const totalProfessionals = yield professionalRepository_1.professionalRepository.count(filters);
        res.json({
            data: professionals,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalProfessionals / limitNum),
                totalItems: totalProfessionals,
                itemsPerPage: limitNum,
            },
        });
    }
    catch (error) {
        console.error("Erro ao buscar profissionais:", error);
        next(error);
    }
});
exports.getAllProfessionalsHandler = getAllProfessionalsHandler;
// Obter um profissional específico pelo ID - Public
const getProfessionalByIdHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!isValidUUID(id)) {
        res.status(400).json({ message: "Formato de ID inválido." });
        return; // Stop execution
    }
    try {
        const professional = yield professionalRepository_1.professionalRepository.findById(id);
        if (!professional) {
            res.status(404).json({ message: "Profissional não encontrado" });
            return; // Stop execution
        }
        res.json(professional);
    }
    catch (error) {
        console.error(`Erro ao buscar profissional ${id}:`, error);
        next(error);
    }
});
exports.getProfessionalByIdHandler = getProfessionalByIdHandler;
// Criar um novo profissional - Requires ADMIN (or Company Owner)
// Main handler logic
const createProfessionalHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Extract data from request body
    const { name, role, image, companyId, serviceIds } = req.body;
    const professionalName = name;
    if (!professionalName) {
        res.status(400).json({ message: "Nome do profissional não fornecido." });
        return; // Stop execution
    }
    const professionalRole = role || "Profissional";
    try {
        // Authorization already checked by middleware
        const dataToCreate = Object.assign({ name: professionalName, role: professionalRole, image: image }, (companyId && isValidUUID(companyId) && { company: { connect: { id: companyId } } }));
        const newProfessional = yield professionalRepository_1.professionalRepository.create(dataToCreate, serviceIds);
        res.status(201).json(newProfessional);
    }
    catch (error) {
        console.error("Erro ao criar profissional:", error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                res.status(400).json({ message: `Erro ao conectar: ${((_a = error.meta) === null || _a === void 0 ? void 0 : _a.cause) || 'Registro relacionado não encontrado (ex: Empresa não existe)'}` });
                return; // Stop execution
            }
        }
        next(error);
    }
});
exports.createProfessionalHandler = createProfessionalHandler;
// Atualizar um profissional existente - Requires ADMIN (or Company Owner)
// Main handler logic
const updateProfessionalHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    // Extract data from request body, excluding fields handled separately
    const _b = req.body, { serviceIds } = _b, dataToUpdate = __rest(_b, ["serviceIds"]);
    try {
        // Authorization already checked by middleware
        // Convert rating and totalReviews if they exist and are strings
        if (dataToUpdate.rating !== undefined && typeof dataToUpdate.rating === 'string') {
            dataToUpdate.rating = parseFloat(dataToUpdate.rating);
        }
        if (dataToUpdate.totalReviews !== undefined && typeof dataToUpdate.totalReviews === 'string') {
            dataToUpdate.totalReviews = parseInt(dataToUpdate.totalReviews, 10);
        }
        // Prevent updating companyId directly through this route
        delete dataToUpdate.companyId;
        // serviceIds are handled separately by the repository method
        const updatedProfessional = yield professionalRepository_1.professionalRepository.update(id, dataToUpdate, serviceIds);
        res.json(updatedProfessional);
    }
    catch (error) {
        console.error(`Erro ao atualizar profissional ${id}:`, error);
        // Handle P2025 from repo update if needed
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: `Erro ao atualizar: ${((_a = error.meta) === null || _a === void 0 ? void 0 : _a.cause) || 'Profissional não encontrado'}` });
            return; // Stop execution
        }
        next(error);
    }
});
exports.updateProfessionalHandler = updateProfessionalHandler;
// Deletar um profissional - Requires ADMIN (or Company Owner)
// Main handler logic
const deleteProfessionalHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    try {
        // Authorization already checked by middleware
        yield professionalRepository_1.professionalRepository.delete(id);
        res.status(204).send();
    }
    catch (error) {
        console.error(`Erro ao deletar profissional ${id}:`, error);
        // Handle P2025 from repo delete
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: `Erro ao deletar: ${((_a = error.meta) === null || _a === void 0 ? void 0 : _a.cause) || 'Profissional não encontrado'}` });
            return; // Stop execution
        }
        next(error);
    }
});
exports.deleteProfessionalHandler = deleteProfessionalHandler;
// Add Service to Professional - Requires ADMIN (or Company Owner)
const addServiceToProfessionalHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { professionalId, serviceId } = req.params;
    // TODO: Implement authorization check based on professional's company
    // TODO: Implement logic using professionalRepository.addService or similar
    res.status(501).json({ message: "Not Implemented" });
    return;
});
exports.addServiceToProfessionalHandler = addServiceToProfessionalHandler;
// Remove Service from Professional - Requires ADMIN (or Company Owner)
const removeServiceFromProfessionalHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { professionalId, serviceId } = req.params;
    // TODO: Implement authorization check based on professional's company
    // TODO: Implement logic using professionalRepository.removeService or similar
    res.status(501).json({ message: "Not Implemented" });
    return;
});
exports.removeServiceFromProfessionalHandler = removeServiceFromProfessionalHandler;
