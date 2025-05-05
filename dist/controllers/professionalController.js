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
const client_1 = require("@prisma/client"); // Added UserRole
// --- Authorization Helpers (Consider moving to middleware) ---
// Helper function for Admin check
const checkAdminRole = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== client_1.UserRole.ADMIN) {
        return res.status(403).json({ message: "Acesso negado. Somente administradores podem realizar esta ação." });
    }
    next();
};
// Helper function to check if user is Admin or owns the company
// Assumes Company model has an ownerId field linked to the User model
const checkAdminOrCompanyOwner = (req, res, next, companyId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!companyId) {
        // If no companyId is involved (e.g., creating a professional without a company initially), only admin can do it?
        // Or adjust logic based on requirements.
        return checkAdminRole(req, res, next);
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
        return res.status(403).json({ message: "Acesso negado. Permissão insuficiente (Admin or Company Owner required)." });
    }
    catch (error) {
        next(error);
    }
});
// Helper function for UUID validation
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
};
// Obter todos os profissionais (com filtros e paginação) - Public
const getAllProfessionals = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // ... (existing code for filtering and pagination) ...
    const { companyId, q, role, serviceId, city, state, minRating, sort, page = "1", limit = "10" } = req.query;
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
            filters.companyId = companyId;
        if (role)
            filters.role = { contains: role, mode: "insensitive" };
        if (serviceId) {
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
exports.getAllProfessionals = getAllProfessionals;
// Obter um profissional específico pelo ID - Public
const getProfessionalById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!isValidUUID(id)) {
        return res.status(400).json({ message: "Formato de ID inválido." });
    }
    try {
        const professional = yield professionalRepository_1.professionalRepository.findById(id);
        if (!professional) {
            return res.status(404).json({ message: "Profissional não encontrado" });
        }
        res.json(professional);
    }
    catch (error) {
        console.error(`Erro ao buscar profissional ${id}:`, error);
        next(error);
    }
});
exports.getProfessionalById = getProfessionalById;
// Criar um novo profissional - Requires ADMIN (or Company Owner)
exports.createProfessional = [
    // Authorization Middleware/Check
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const { companyId } = req.body;
        // Use the specific helper which checks Admin OR Owner (if implemented)
        // For now, using Admin only as owner logic is pending schema change
        yield checkAdminOrCompanyOwner(req, res, next, companyId);
    }),
    // Main Controller Logic
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const { name: reqName, role: reqRole, image, companyId, serviceIds, bio, phone } = req.body;
        const professionalName = reqName;
        if (!professionalName) {
            return res.status(400).json({ message: "Nome do profissional não fornecido." });
        }
        const professionalRole = reqRole || "Profissional";
        try {
            const dataToCreate = Object.assign({ name: professionalName, role: professionalRole, image: image }, (companyId && isValidUUID(companyId) && { company: { connect: { id: companyId } } }));
            const newProfessional = yield professionalRepository_1.professionalRepository.create(dataToCreate, serviceIds);
            res.status(201).json(newProfessional);
        }
        catch (error) {
            console.error("Erro ao criar profissional:", error);
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    return res.status(400).json({ message: `Erro ao conectar: ${((_a = error.meta) === null || _a === void 0 ? void 0 : _a.cause) || 'Registro relacionado não encontrado (ex: Empresa não existe)'}` });
                }
            }
            next(error);
        }
    })
];
// Atualizar um profissional existente - Requires ADMIN (or Company Owner)
exports.updateProfessional = [
    // Authorization Middleware/Check
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const professional = yield professionalRepository_1.professionalRepository.findById(id);
            if (!professional) {
                return res.status(404).json({ message: "Profissional não encontrado." });
            }
            // Check permission based on the professional's associated company
            yield checkAdminOrCompanyOwner(req, res, next, professional.companyId);
        }
        catch (error) {
            next(error);
        }
    }),
    // Main Controller Logic
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const { id } = req.params;
        const _b = req.body, { companyId, serviceIds } = _b, dataToUpdate = __rest(_b, ["companyId", "serviceIds"]);
        try {
            if (dataToUpdate.rating !== undefined && typeof dataToUpdate.rating === 'string') {
                dataToUpdate.rating = parseFloat(dataToUpdate.rating);
            }
            if (dataToUpdate.totalReviews !== undefined && typeof dataToUpdate.totalReviews === 'string') {
                dataToUpdate.totalReviews = parseInt(dataToUpdate.totalReviews, 10);
            }
            delete dataToUpdate.companyId;
            delete dataToUpdate.serviceIds;
            const updatedProfessional = yield professionalRepository_1.professionalRepository.update(id, dataToUpdate, serviceIds);
            res.json(updatedProfessional);
        }
        catch (error) {
            console.error(`Erro ao atualizar profissional ${id}:`, error);
            // Handle P2025 from repo update if needed
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                return res.status(404).json({ message: `Erro ao atualizar: ${((_a = error.meta) === null || _a === void 0 ? void 0 : _a.cause) || 'Profissional não encontrado'}` });
            }
            next(error);
        }
    })
];
// Deletar um profissional - Requires ADMIN (or Company Owner)
exports.deleteProfessional = [
    // Authorization Middleware/Check
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const professional = yield professionalRepository_1.professionalRepository.findById(id);
            if (!professional) {
                // Allow deletion attempt even if not found, repo handles P2025
                // return res.status(404).json({ message: "Profissional não encontrado." });
            }
            // Check permission based on the professional's associated company (if exists)
            yield checkAdminOrCompanyOwner(req, res, next, professional === null || professional === void 0 ? void 0 : professional.companyId);
        }
        catch (error) {
            next(error);
        }
    }),
    // Main Controller Logic
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const { id } = req.params;
        try {
            yield professionalRepository_1.professionalRepository.delete(id);
            res.status(204).send();
        }
        catch (error) {
            console.error(`Erro ao deletar profissional ${id}:`, error);
            // Handle P2025 from repo delete
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                return res.status(404).json({ message: `Erro ao deletar: ${((_a = error.meta) === null || _a === void 0 ? void 0 : _a.cause) || 'Profissional não encontrado'}` });
            }
            next(error);
        }
    })
];
// Add Service to Professional - Requires ADMIN (or Company Owner)
const addServiceToProfessional = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO: Implement authorization check based on professional's company
    res.status(501).json({ message: "Not Implemented" });
});
exports.addServiceToProfessional = addServiceToProfessional;
// Remove Service from Professional - Requires ADMIN (or Company Owner)
const removeServiceFromProfessional = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO: Implement authorization check based on professional's company
    res.status(501).json({ message: "Not Implemented" });
});
exports.removeServiceFromProfessional = removeServiceFromProfessional;
