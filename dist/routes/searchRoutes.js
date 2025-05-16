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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const professionalRepository_1 = require("../repositories/professionalRepository");
const serviceRepository_1 = require("../repositories/serviceRepository");
const companyRepository_1 = __importDefault(require("../repositories/companyRepository"));
const searchUtils_1 = require("../utils/searchUtils");
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
    var _a, _b;
    // Extract and validate query parameters
    const { type, q, category, sort, page = "1", limit = "10", professionalTipo, ids } = req.query;
    // Initialize response containers
    let professionals = [];
    let services = [];
    let companies = [];
    // Parse pagination parameters with validation to avoid negative values
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const skip = (pageNum - 1) * limitNum;
    // Create order by object with proper typing
    let professionalOrderBy = { name: "asc" };
    let serviceOrderBy = { name: "asc" };
    if (sort === "rating") {
        // Handle rating sort for professionals only, as Service model doesn't have rating field
        professionalOrderBy = { rating: "desc" };
        // For services, continue using name as the fallback sort
        serviceOrderBy = { name: "asc" };
    }
    try {
        // Define what data types to fetch based on the 'type' parameter
        const fetchAll = !type || type === 'all';
        const fetchProfessionals = fetchAll || type === 'professionals';
        const fetchServices = fetchAll || type === 'services';
        const fetchCompanies = fetchAll || type === 'companies';
        // 1. Fetch professionals if needed
        if (fetchProfessionals) {
            // Build professional filters
            const professionalFilters = {};
            // Handle search term filtering
            if (q) {
                if ((0, searchUtils_1.isUUID)(q)) {
                    professionalFilters.id = q;
                }
                else {
                    professionalFilters.OR = [
                        { name: { contains: q, mode: "insensitive" } },
                        { role: { contains: q, mode: "insensitive" } }
                    ];
                }
            }
            // Handle multiple IDs filtering
            if (ids) {
                const idList = ids.split(',').map(id => id.trim());
                professionalFilters.id = { in: idList };
            }
            // Filter by category
            if (category) {
                professionalFilters.services = {
                    some: {
                        service: {
                            category: { name: { contains: category, mode: "insensitive" } }
                        }
                    }
                };
            }
            // Filter by professional type
            if (professionalTipo && professionalTipo !== 'all') {
                professionalFilters.role = { contains: professionalTipo, mode: "insensitive" };
            }
            // Fetch professionals
            const professionalsData = yield professionalRepository_1.professionalRepository.findMany(professionalFilters, professionalOrderBy, skip, limitNum);
            // Transform using the utility function with multi-service support
            professionals = professionalsData.map(prof => (0, searchUtils_1.transformProfessional)(prof));
        }
        // 2. Fetch services if needed
        if (fetchServices) {
            // Build service filters
            const serviceFilters = {};
            // Handle search term filtering
            if (q) {
                if ((0, searchUtils_1.isUUID)(q)) {
                    serviceFilters.id = q;
                }
                else {
                    serviceFilters.name = { contains: q, mode: "insensitive" };
                }
            }
            // Handle multiple IDs filtering
            if (ids) {
                const idList = ids.split(',').map(id => id.trim());
                serviceFilters.id = { in: idList };
            }
            // Filter by category
            if (category) {
                serviceFilters.category = { name: { contains: category, mode: "insensitive" } };
            }
            // Filter by professionalId (NEW)
            const professionalId = req.query.professionalId;
            if (professionalId) {
                serviceFilters.professionals = { some: { professionalId } };
            }
            else {
                // Only return services with at least one professional
                serviceFilters.professionals = { some: {} };
            }
            // Fetch services with proper sort order
            const servicesData = yield serviceRepository_1.serviceRepository.findMany(serviceFilters, serviceOrderBy, skip, limitNum);
            // Log the raw data structure for debugging
            console.log('Raw service data structure (first service):', JSON.stringify(servicesData[0], null, 2));
            // Transform using the utility function with multi-service support
            // If filtering by professionalId, only include that professional in the professionals array
            services = servicesData.map(service => {
                let transformed = (0, searchUtils_1.transformService)(service);
                if (professionalId && Array.isArray(transformed.professionals)) {
                    transformed.professionals = transformed.professionals.filter((p) => p.id === professionalId);
                }
                return transformed;
            });
            // Add debug logging to help diagnose data structure issues
            console.log('Sample professional services data:', professionals.length > 0 ?
                `First professional has ${((_a = professionals[0].services) === null || _a === void 0 ? void 0 : _a.length) || 0} services` :
                'No professionals found');
            console.log('Sample service professionals data:', services.length > 0 ?
                `First service has ${((_b = services[0].professionals) === null || _b === void 0 ? void 0 : _b.length) || 0} professionals` :
                'No services found');
            // Ensure each professional in the services data has the complete services array
            services.forEach((service) => {
                if (service.professionals && Array.isArray(service.professionals)) {
                    service.professionals.forEach((prof) => {
                        // Make sure services is always an array
                        if (!prof.services || !Array.isArray(prof.services)) {
                            prof.services = [];
                        }
                        // If the services array is empty but the professional should have services,
                        // we can try to find them from other professionals in the result set
                        if (prof.services.length === 0) {
                            // Look for this professional in other services to collect their services
                            const servicesForThisProf = [];
                            // Search in all services for this professional's services
                            services.forEach((otherService) => {
                                if (otherService.professionals) {
                                    const matchingProf = otherService.professionals.find((p) => p.id === prof.id);
                                    if (matchingProf && matchingProf.services && matchingProf.services.length > 0) {
                                        // Add services that don't already exist in the array
                                        matchingProf.services.forEach((svc) => {
                                            if (!servicesForThisProf.some((s) => s.id === svc.id)) {
                                                servicesForThisProf.push(svc);
                                            }
                                        });
                                    }
                                }
                            });
                            // Update this professional's services array with what we found
                            prof.services = servicesForThisProf;
                        }
                    });
                }
            });
        }
        // 3. Fetch companies if needed
        if (fetchCompanies) {
            try {
                // Fetch companies
                const result = yield companyRepository_1.default.findAll(pageNum, limitNum);
                // Transform using the utility function with multi-service support
                companies = result.companies.map(company => (0, searchUtils_1.transformCompany)(company));
            }
            catch (error) {
                console.error('Error fetching companies:', error);
                companies = []; // Fallback to empty array if there's an error
            }
        }
        // Build professional_services as a list of services with their professionals
        let professional_services = [];
        // Build professionalServices as a list of professionals with their services
        let professionalServices = [];
        // Process services data if available
        if (services.length > 0) {
            // Build services with professionals structure
            professional_services = (0, searchUtils_1.buildServicesWithProfessionals)(services);
            // Also prepare professionals with services from the services data
            // This ensures consistency between both representations
            professionalServices = (0, searchUtils_1.buildServicesByProfessional)(services);
            // Replace the professionals array if we have better data from the services query
            if (professionalServices.length > 0) {
                professionals = professionalServices;
            }
        }
        // If we don't have services data, but have professionals data
        else if (professionals.length > 0) {
            // Extract services from professionals with their professional info
            const servicesFromProfessionals = [];
            // For each professional, extract all their services
            professionals.forEach(prof => {
                if (prof.services && Array.isArray(prof.services)) {
                    prof.services.forEach((service) => {
                        // Create a service object with the professional attached
                        servicesFromProfessionals.push({
                            id: service.id,
                            name: service.name,
                            duration: service.duration,
                            description: service.description,
                            category: service.category,
                            multiServiceEnabled: true,
                            professionals: [{
                                    id: prof.id,
                                    name: prof.name,
                                    role: prof.role,
                                    rating: prof.rating,
                                    image: prof.image,
                                    price: service.price,
                                    company: prof.company,
                                    hasMultiServiceSupport: true,
                                    services: prof.services // Include all services this professional offers
                                }]
                        });
                    });
                }
            });
            // Build services with professionals structure from the extracted services
            professional_services = (0, searchUtils_1.buildServicesWithProfessionals)(servicesFromProfessionals);
        }
        // Log search statistics
        console.log(`Search results: ${professionals.length} professionals, ${services.length} services, ${companies.length} companies`);
        console.log(`Professional services count: ${professional_services.length}`);
        // Create response object
        const response = {};
        // Handle type parameter to return only requested data types
        if (type === 'professionals') {
            response.professionals = professionals;
            // Also include professional_services for consistent API response
            response.professional_services = professional_services;
        }
        else if (type === 'services') {
            // Return both services and services grouped by professional
            response.services = services;
            response.professional_services = professional_services;
        }
        else if (type === 'companies') {
            response.companies = companies;
        }
        else {
            // Return all fetched data types (default)
            if (fetchProfessionals) {
                response.professionals = professionals;
            }
            if (fetchServices) {
                response.services = services;
                response.professional_services = professional_services;
            }
            if (fetchCompanies) {
                response.companies = companies;
            }
        }
        // Return the response
        res.json(response);
    }
    catch (error) {
        console.error('Error in search endpoint:', error);
        res.status(500).json({ message: 'An error occurred while searching' });
    }
})));
exports.default = router;
