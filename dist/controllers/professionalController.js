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
// Helper function for UUID validation
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
};
// Obter todos os profissionais (com filtros e paginação)
const getAllProfessionals = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Extrair filtros e paginação da query string
    const { companyId, q, // Search term
    role, // Filter by role/specialty
    serviceId, // Filter by service offered
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
        // Corrected: Add location filters (based on company address)
        const companyFilter = {};
        const addressFilter = {}; // Corrected type
        if (city)
            addressFilter.city = { contains: city, mode: "insensitive" };
        if (state)
            addressFilter.state = { contains: state, mode: "insensitive" };
        if (Object.keys(addressFilter).length > 0) {
            companyFilter.address = addressFilter;
            // Apply the company filter to the main professional filter
            filters.company = companyFilter;
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
// Obter um profissional específico pelo ID
const getProfessionalById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!isValidUUID(id)) {
        // Corrected: Remove return before res.status
        res.status(400).json({ message: "Formato de ID inválido." });
        return;
    }
    try {
        const professional = yield professionalRepository_1.professionalRepository.findById(id);
        if (!professional) {
            // Corrected: Remove return before res.status
            res.status(404).json({ message: "Profissional não encontrado" });
            return;
        }
        res.json(professional);
    }
    catch (error) {
        console.error(`Erro ao buscar profissional ${id}:`, error);
        next(error);
    }
});
exports.getProfessionalById = getProfessionalById;
// Criar um novo profissional
const createProfessional = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, role, image, companyId, serviceIds } = req.body;
    // Validation should be handled by express-validator
    try {
        const dataToCreate = {
            name,
            role,
            image: image,
            company: { connect: { id: companyId } },
            // Rating and totalReviews have defaults
        };
        const newProfessional = yield professionalRepository_1.professionalRepository.create(dataToCreate, serviceIds);
        res.status(201).json(newProfessional);
    }
    catch (error) {
        console.error("Erro ao criar profissional:", error);
        next(error);
    }
});
exports.createProfessional = createProfessional;
// Atualizar um profissional existente
const updateProfessional = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const _a = req.body, { companyId, serviceIds } = _a, dataToUpdate = __rest(_a, ["companyId", "serviceIds"]);
    // Validation should be handled by express-validator
    try {
        if (dataToUpdate.rating !== undefined)
            dataToUpdate.rating = parseFloat(dataToUpdate.rating);
        if (dataToUpdate.totalReviews !== undefined)
            dataToUpdate.totalReviews = parseInt(dataToUpdate.totalReviews, 10);
        const updatedProfessional = yield professionalRepository_1.professionalRepository.update(id, dataToUpdate, serviceIds);
        res.json(updatedProfessional); // Repository handles not found error
    }
    catch (error) {
        console.error(`Erro ao atualizar profissional ${id}:`, error);
        next(error);
    }
});
exports.updateProfessional = updateProfessional;
// Deletar um profissional
const deleteProfessional = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield professionalRepository_1.professionalRepository.delete(id); // Repository handles not found error
        res.status(204).send();
    }
    catch (error) {
        console.error(`Erro ao deletar profissional ${id}:`, error);
        next(error);
    }
});
exports.deleteProfessional = deleteProfessional;
// Add Service to Professional (Placeholder - needs implementation in repository)
const addServiceToProfessional = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(501).json({ message: "Not Implemented" });
});
exports.addServiceToProfessional = addServiceToProfessional;
// Remove Service from Professional (Placeholder - needs implementation in repository)
const removeServiceFromProfessional = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(501).json({ message: "Not Implemented" });
});
exports.removeServiceFromProfessional = removeServiceFromProfessional;
