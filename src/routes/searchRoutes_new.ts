import { Router, Request } from "express";
import asyncHandler from "../utils/asyncHandler";
import { professionalRepository } from "../repositories/professionalRepository";
import { serviceRepository } from "../repositories/serviceRepository";
import companyRepository from "../repositories/companyRepository";
import { Prisma } from "@prisma/client";
import { 
  transformProfessional, 
  transformService, 
  transformCompany,
  isUUID 
} from "../utils/searchUtils";
import { 
  ProfessionalWithServices, 
  ServiceWithRelations, 
  CompanyWithDetails, 
  SearchResult,
  SearchType
} from "../types/searchTypes";
import {
  ProfessionalResponse,
  ServiceResponse,
  CompanyResponse,
  SearchResponse
} from "../types/responses";

interface SearchFilters {
  q?: string;
  ids?: string[];
  category?: string;
  professionalTipo?: string;
  sort?: string;
  page: number;
  limit: number;
  type?: SearchType;
}

const router = Router();

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
router.get(
  "/",
  asyncHandler(async (req: Request, res) => {
    // Extract and validate query parameters
    const { type, q, category, sort, page = "1", limit = "10", professionalTipo, ids } = req.query;
    
    // Initialize response containers
    let professionals: any[] = [];
    let services: any[] = [];
    let companies: any[] = [];
    
    // Parse pagination parameters with validation to avoid negative values
    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 10, 1), 50);
    const skip = (pageNum - 1) * limitNum;    // Create order by object with proper typing
    let professionalOrderBy: Prisma.ProfessionalOrderByWithRelationInput = { name: "asc" };
    let serviceOrderBy: Prisma.ServiceOrderByWithRelationInput = { name: "asc" };
    
    if (sort === "rating") {
      // Handle rating sort for professionals only, as Service model doesn't have rating field
      professionalOrderBy = { rating: "desc" };
      // For services, continue using name as the fallback sort
      serviceOrderBy = { name: "asc" };
    }

    try {      // Define what data types to fetch based on the 'type' parameter
      const fetchAll = !type || type === 'all';
      const fetchProfessionals = fetchAll || type === 'professionals';
      const fetchServices = fetchAll || type === 'services'; 
      const fetchCompanies = fetchAll || type === 'companies';
      
      // 1. Fetch professionals if needed
      if (fetchProfessionals) {
        // Build professional filters
        const professionalFilters: any = {};
        
        // Handle search term filtering
        if (q) {
          if (isUUID(q as string)) {
            professionalFilters.id = q;
          } else {
            professionalFilters.OR = [
              { name: { contains: q as string, mode: "insensitive" } },
              { role: { contains: q as string, mode: "insensitive" } }
            ];
          }
        }
        
        // Handle multiple IDs filtering
        if (ids) {
          const idList = (ids as string).split(',').map(id => id.trim());
          professionalFilters.id = { in: idList };
        }
        
        // Filter by category
        if (category) {
          professionalFilters.services = { 
            some: { 
              service: { 
                category: { name: { contains: category as string, mode: "insensitive" } }
              } 
            } 
          };
        }
        
        // Filter by professional type
        if (professionalTipo && professionalTipo !== 'all') {
          professionalFilters.role = { contains: professionalTipo as string, mode: "insensitive" };
        }
          // Fetch professionals
        const professionalsData = await professionalRepository.findMany(
          professionalFilters,
          professionalOrderBy,
          skip,
          limitNum
        );
        
        // Transform using the utility function with multi-service support
        professionals = professionalsData.map(prof => transformProfessional(prof));
      }
      
      // 2. Fetch services if needed
      if (fetchServices) {
        // Build service filters
        const serviceFilters: any = {};
        
        // Handle search term filtering
        if (q) {
          if (isUUID(q as string)) {
            serviceFilters.id = q;
          } else {
            serviceFilters.name = { contains: q as string, mode: "insensitive" };
          }
        }
        
        // Handle multiple IDs filtering
        if (ids) {
          const idList = (ids as string).split(',').map(id => id.trim());
          serviceFilters.id = { in: idList };
        }
        
        // Filter by category
        if (category) {
          serviceFilters.category = { name: { contains: category as string, mode: "insensitive" } };
        }
        
        // Filter by professionalId (NEW)
        const professionalId = req.query.professionalId as string | undefined;
        if (professionalId) {
          serviceFilters.professionals = { some: { professionalId } };
        } else {
          // Only return services with at least one professional
          serviceFilters.professionals = { some: {} };
        }
        // Fetch services with proper sort order
        const servicesData = await serviceRepository.findMany(
          serviceFilters,
          serviceOrderBy,
          skip,
          limitNum
        );
        // Transform using the utility function with multi-service support
        // If filtering by professionalId, only include that professional in the professionals array
        services = servicesData.map(service => {
          let transformed = transformService(service);
          if (professionalId && Array.isArray(transformed.professionals)) {
            transformed.professionals = transformed.professionals.filter(p => p.id === professionalId);
          }
          return transformed;
        });
      }
      
      // 3. Fetch companies if needed
      if (fetchCompanies) {
        try {
          // Fetch companies
          const result = await companyRepository.findAll(pageNum, limitNum);
          
          // Transform using the utility function with multi-service support
          companies = result.companies.map(company => transformCompany(company));
        } catch (error) {
          console.error('Error fetching companies:', error);
          companies = []; // Fallback to empty array if there's an error
        }
      }
        // Log search statistics
      console.log(`Search results: ${professionals.length} professionals, ${services.length} services, ${companies.length} companies`);
        // Create response object
      const response: any = {};
      
      // Handle type parameter to return only requested data types
      if (type === 'professionals') {
        // Return only professionals
        response.professionals = professionals;
      } else if (type === 'services') {
        // Return only services
        response.services = services;
      } else if (type === 'companies') {
        // Return only companies
        response.companies = companies;
      } else {
        // Return all fetched data types (default)
        if (fetchProfessionals) {
          response.professionals = professionals;
        }
        
        if (fetchServices) {
          response.services = services;
        }
        
        if (fetchCompanies) {
          response.companies = companies;
        }
      }
      
      // Return the response
      res.json(response);
      
    } catch (error) {
      console.error('Error in search endpoint:', error);
      res.status(500).json({ message: 'An error occurred while searching' });
    }
  })
);

export default router;
