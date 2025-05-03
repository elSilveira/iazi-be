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
// Obter todos os serviços (com filtros e paginação)
const getAllServices = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Extrair filtros e paginação da query string
    const { companyId, category, // Category name filter
    q, // Search term
    minPrice, maxPrice, 
    // minRating, // Rating is not directly on Service model
    sort, // e.g., "price_asc", "price_desc", "name_asc"
    page = "1", // Default page 1
    limit = "10" // Default 10 items per page
     } = req.query;
    // Validar e converter parâmetros de paginação
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
        // Corrected: Don't return void, just send response
        res.status(400).json({ message: "Parâmetros de paginação inválidos (page e limit devem ser números positivos)." });
        return;
    }
    const skip = (pageNum - 1) * limitNum;
    try {
        // Construir objeto de filtros para Prisma
        const filters = {};
        if (companyId)
            filters.companyId = companyId;
        // Corrected: Filter by category name through relation
        if (category)
            filters.category = { name: { contains: category, mode: "insensitive" } };
        if (q) {
            const searchTerm = q;
            filters.OR = [
                { name: { contains: searchTerm, mode: "insensitive" } },
                { description: { contains: searchTerm, mode: "insensitive" } },
                // Corrected: Search in category name through relation
                { category: { name: { contains: searchTerm, mode: "insensitive" } } },
                // Add search in company name if needed via relations
                { company: { name: { contains: searchTerm, mode: "insensitive" } } },
            ];
        }
        // Add price filters (assuming price is stored as String, requires careful comparison or schema change)
        // This is complex with string prices. For now, skipping price filtering.
        // Consider changing schema `price` to Decimal or Float for proper filtering.
        // if (minPrice) { /* Logic for string price comparison >= minPrice */ }
        // if (maxPrice) { /* Logic for string price comparison <= maxPrice */ }
        // Construir objeto de ordenação para Prisma
        let orderBy = {};
        switch (sort) {
            // case "rating_desc": // Rating not on service
            //   break;
            case "price_asc":
                orderBy = { price: "asc" }; // Sorting string price might be lexicographical, not numerical
                break;
            case "price_desc":
                orderBy = { price: "desc" }; // Sorting string price might be lexicographical, not numerical
                break;
            case "name_asc":
                orderBy = { name: "asc" };
                break;
            default:
                orderBy = { name: "asc" }; // Default sort
        }
        // Assume repository methods exist
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
        next(error);
    }
});
exports.getAllServices = getAllServices;
// Obter um serviço específico pelo ID
const getServiceById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const service = yield serviceRepository_1.serviceRepository.findById(id);
        if (!service) {
            const error = new Error("Serviço não encontrado");
            error.statusCode = 404;
            return next(error);
        }
        res.json(service);
    }
    catch (error) {
        next(error);
    }
});
exports.getServiceById = getServiceById;
// Criar um novo serviço
const createService = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Corrected: Use `duration` (String) as per schema, not durationMinutes
    const { name, description, price, duration, image, categoryId, companyId } = req.body;
    try {
        // Validate categoryId exists if provided?
        const dataToCreate = {
            name,
            description,
            price, // String as per schema
            duration, // String as per schema
            image,
            category: { connect: { id: parseInt(categoryId, 10) } }, // Connect by category ID (assuming it's Int)
            company: { connect: { id: companyId } },
        };
        const newService = yield serviceRepository_1.serviceRepository.create(dataToCreate);
        res.status(201).json(newService);
    }
    catch (error) {
        next(error);
    }
});
exports.createService = createService;
// Atualizar um serviço existente
const updateService = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // Corrected: Use `duration` (String), handle categoryId update
    const _a = req.body, { companyId, categoryId } = _a, dataToUpdate = __rest(_a, ["companyId", "categoryId"]);
    try {
        // Prepare update data, connect category if categoryId is provided
        const updatePayload = Object.assign({}, dataToUpdate);
        if (categoryId !== undefined) {
            updatePayload.category = { connect: { id: parseInt(categoryId, 10) } };
        }
        // Price and duration are strings, no conversion needed unless schema changes
        const updatedService = yield serviceRepository_1.serviceRepository.update(id, updatePayload);
        res.json(updatedService);
    }
    catch (error) {
        next(error);
    }
});
exports.updateService = updateService;
// Deletar um serviço
const deleteService = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const deletedService = yield serviceRepository_1.serviceRepository.delete(id);
        res.status(200).json({ message: "Serviço excluído com sucesso", service: deletedService });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteService = deleteService;
