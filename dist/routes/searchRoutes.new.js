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
// filepath: c:\Users\duti_\apps\iazi-be\src\routes\searchRoutes.ts
const express_1 = require("express");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const professionalRepository_1 = require("../repositories/professionalRepository");
const serviceRepository_1 = require("../repositories/serviceRepository");
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
        // Map services to make them more accessible
        professionals = professionals.map(prof => {
            // Transform services array to be more usable
            const mappedServices = prof.services.map((ps) => ({
                id: ps.service.id,
                name: ps.service.name,
                duration: ps.service.duration,
                price: ps.price || ps.service.price,
                description: ps.description || ps.service.description
            }));
            // Keep company data if it exists
            const { services: _ } = prof, profWithoutServices = __rest(prof, ["services"]);
            return Object.assign(Object.assign({}, profWithoutServices), { services: mappedServices });
        });
        // 2. Always fetch all services with their professionals
        services = yield serviceRepository_1.serviceRepository.findWithProfessionals();
        // Transform services to include professional data in a standardized format
        services = services.map((service) => {
            return Object.assign(Object.assign({}, service), { professionals: service.professionals.map((ps) => ({
                    id: ps.professional.id,
                    name: ps.professional.name,
                    role: ps.professional.role,
                    rating: ps.professional.rating,
                    image: ps.professional.image,
                    price: ps.price || service.price,
                    company: ps.professional.company
                })) });
        });
        // 3. For now, we'll use an empty array for companies
        // Once the repository is fixed, we can replace this with:
        // companies = await companyRepository.findMany(...);
        companies = [];
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
