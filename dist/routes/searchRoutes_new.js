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
const express_1 = require("express");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const professionalRepository_1 = require("../repositories/professionalRepository");
const serviceRepository_1 = require("../repositories/serviceRepository");
const companyRepository_1 = __importDefault(require("../repositories/companyRepository"));
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Busca geral de profissionais, serviços e empresas (com vínculos)
 *     tags: [Search, Professionals, Services, Companies]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Termo de busca para filtrar resultados
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Categoria para filtrar resultados
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Critério de ordenação (rating, name)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Itens por página
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, professionals, services, companies]
 *         description: Tipo de entidade para buscar (all = tudo, professionals = apenas profissionais com serviços, services = apenas serviços com profissionais, companies = empresas com serviços)
 *       - in: query
 *         name: professionalTipo
 *         schema:
 *           type: string
 *         description: Tipo de profissional para filtrar
 *     responses:
 *       200:
 *         description: Lista de resultados retornada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 professionals:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       services:
 *                         type: array
 *                         items:
 *                           type: object
 *                 services:
 *                   type: array
 *                   items:
 *                     type: object
 *                 companies:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/", (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, q, category, sort, page = "1", limit = "10", professionalTipo } = req.query;
    let professionals = [];
    let services = [];
    let companies = [];
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    // Order by criteria
    let orderBy = { name: "asc" };
    if (sort === "rating") {
        orderBy = { rating: "desc" };
    }
    try {
        // 1. Always fetch professionals with their services
        const professionalFilters = {};
        if (q) {
            professionalFilters.OR = [
                { name: { contains: q, mode: "insensitive" } },
                { role: { contains: q, mode: "insensitive" } }
            ];
        }
        if (category) {
            professionalFilters.services = {
                some: {
                    service: {
                        category: { name: { contains: category, mode: "insensitive" } }
                    }
                }
            };
        }
        if (professionalTipo && professionalTipo !== 'all') {
            professionalFilters.role = { contains: professionalTipo, mode: "insensitive" };
        }
        professionals = yield professionalRepository_1.professionalRepository.findMany(professionalFilters, orderBy, skip, limitNum);
        // Map services to make them more accessible with detailed information for multi-service appointments
        professionals = professionals.map(prof => {
            // Transform services array to be more usable with detailed service information
            const mappedServices = prof.services.map((ps) => ({
                id: ps.service.id,
                name: ps.service.name,
                duration: ps.service.duration,
                price: ps.price || ps.service.price,
                description: ps.description || ps.service.description,
                category: ps.service.category,
                // Add multi-service support details
                multiServiceEnabled: true,
                averageTimeToComplete: ps.service.duration
            }));
            // Keep company data if it exists
            const { services: _ } = prof, profWithoutServices = __rest(prof, ["services"]);
            return Object.assign(Object.assign({}, profWithoutServices), { services: mappedServices, 
                // Add availability information for appointment booking
                hasMultiServiceSupport: true });
        });
        // 2. Always fetch all services with their professionals
        services = yield serviceRepository_1.serviceRepository.findWithProfessionals();
        // Transform services to include professional data in a standardized format with multi-service support
        services = services.map((service) => {
            // Add multi-service specific fields to the service
            const enhancedService = Object.assign(Object.assign({}, service), { multiServiceEnabled: true, professionals: service.professionals.map((ps) => ({
                    id: ps.professional.id,
                    name: ps.professional.name,
                    role: ps.professional.role,
                    rating: ps.professional.rating,
                    image: ps.professional.image,
                    price: ps.price || service.price,
                    company: ps.professional.company,
                    // Add fields for multi-service appointment support
                    hasMultiServiceSupport: true,
                    // Include any other services the professional offers
                    otherServices: ps.professional.services ?
                        ps.professional.services.map((s) => ({
                            id: s.service.id,
                            name: s.service.name,
                            duration: s.service.duration,
                            price: s.price || s.service.price
                        })) : []
                })) });
            return enhancedService;
        });
        // 3. Fetch companies with filtering
        try {
            // Use findAll method instead of findMany, as it's what's properly implemented in the repository
            const result = yield companyRepository_1.default.findAll(pageNum, limitNum);
            companies = result.companies;
            // Enhance companies with multi-service support information
            companies = companies.map((company) => {
                // Filter out company data to include only what we need
                const { id, name, description, logo, coverImage, rating, totalReviews, address, categories } = company;
                return {
                    id,
                    name,
                    description,
                    logo,
                    coverImage,
                    rating,
                    totalReviews,
                    address,
                    categories,
                    // Add multi-service support indicator
                    hasMultiServiceSupport: true,
                    // Note that this company can handle appointments with multiple services
                    supportsMultiServiceBooking: true
                };
            });
        }
        catch (error) {
            console.error('Error fetching companies:', error);
            companies = []; // Fallback to empty array if there's an error
        }
        console.log(`Search results: ${professionals.length} professionals, ${services.length} services, ${companies.length} companies`);
        // Always return all three arrays, regardless of the type parameter
        res.json({ professionals, services, companies });
    }
    catch (error) {
        console.error('Error in search endpoint:', error);
        res.status(500).json({ message: 'An error occurred while searching' });
    }
})));
exports.default = router;
