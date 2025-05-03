import { Request, Response, NextFunction } from "express";
import { professionalRepository } from "../repositories/professionalRepository";
import { Prisma } from "@prisma/client";

// Helper function for UUID validation
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
};

// Obter todos os profissionais (com filtros e paginação)
export const getAllProfessionals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Extrair filtros e paginação da query string
  const { 
    companyId, 
    q, // Search term
    role, // Filter by role/specialty
    serviceId, // Filter by service offered
    city, 
    state, 
    minRating, 
    sort, // e.g., "rating_desc", "name_asc"
    page = "1", // Default page 1
    limit = "10" // Default 10 items per page
  } = req.query;

  // Validar e converter parâmetros de paginação
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
    res.status(400).json({ message: "Parâmetros de paginação inválidos (page e limit devem ser números positivos)." });
    return;
  }

  const skip = (pageNum - 1) * limitNum;

  try {
    // Construir objeto de filtros para Prisma
    const filters: Prisma.ProfessionalWhereInput = {};
    if (companyId) filters.companyId = companyId as string;
    if (role) filters.role = { contains: role as string, mode: "insensitive" };
    if (serviceId) {
      filters.services = {
        some: { serviceId: serviceId as string }
      };
    }
    if (q) {
      const searchTerm = q as string;
      filters.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { role: { contains: searchTerm, mode: "insensitive" } },
        { company: { name: { contains: searchTerm, mode: "insensitive" } } },
        { services: { some: { service: { name: { contains: searchTerm, mode: "insensitive" } } } } },
      ];
    }
    
    // Corrected: Add location filters (based on company address)
    const companyFilter: Prisma.CompanyWhereInput = {};
    const addressFilter: Prisma.CompanyAddressWhereInput = {}; // Corrected type
    if (city) addressFilter.city = { contains: city as string, mode: "insensitive" };
    if (state) addressFilter.state = { contains: state as string, mode: "insensitive" };
    if (Object.keys(addressFilter).length > 0) {
        companyFilter.address = addressFilter;
        // Apply the company filter to the main professional filter
        filters.company = companyFilter;
    }
    
    // Add rating filter (schema has rating as Float)
    if (minRating) {
      const ratingNum = parseFloat(minRating as string);
      if (!isNaN(ratingNum)) {
        filters.rating = { gte: ratingNum };
      }
    }

    // Construir objeto de ordenação para Prisma
    let orderBy: Prisma.ProfessionalOrderByWithRelationInput = {};
    switch (sort as string) {
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
    const professionals = await professionalRepository.findMany(filters, orderBy, skip, limitNum);
    const totalProfessionals = await professionalRepository.count(filters);

    res.json({
      data: professionals,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalProfessionals / limitNum),
        totalItems: totalProfessionals,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar profissionais:", error);
    next(error); 
  }
};

// Obter um profissional específico pelo ID
export const getProfessionalById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  if (!isValidUUID(id)) {
    // Corrected: Remove return before res.status
    res.status(400).json({ message: "Formato de ID inválido." });
    return;
  }
  try {
    const professional = await professionalRepository.findById(id);
    if (!professional) {
      // Corrected: Remove return before res.status
      res.status(404).json({ message: "Profissional não encontrado" });
      return;
    }
    res.json(professional);
  } catch (error) {
    console.error(`Erro ao buscar profissional ${id}:`, error);
    next(error);
  }
};

// Criar um novo profissional
export const createProfessional = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { name, role, image, companyId, serviceIds } = req.body;

  // Validation should be handled by express-validator

  try {
    const dataToCreate: Prisma.ProfessionalCreateInput = {
      name,
      role,
      image: image,
      company: { connect: { id: companyId } },
      // Rating and totalReviews have defaults
    };

    const newProfessional = await professionalRepository.create(dataToCreate, serviceIds as string[] | undefined);
    res.status(201).json(newProfessional);
  } catch (error) {
    console.error("Erro ao criar profissional:", error);
    next(error);
  }
};

// Atualizar um profissional existente
export const updateProfessional = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { companyId, serviceIds, ...dataToUpdate } = req.body;

  // Validation should be handled by express-validator

  try {
    if (dataToUpdate.rating !== undefined) dataToUpdate.rating = parseFloat(dataToUpdate.rating);
    if (dataToUpdate.totalReviews !== undefined) dataToUpdate.totalReviews = parseInt(dataToUpdate.totalReviews, 10);

    const updatedProfessional = await professionalRepository.update(id, dataToUpdate as Prisma.ProfessionalUpdateInput, serviceIds as string[] | undefined);
    res.json(updatedProfessional); // Repository handles not found error
  } catch (error) {
    console.error(`Erro ao atualizar profissional ${id}:`, error);
    next(error);
  }
};

// Deletar um profissional
export const deleteProfessional = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;

  try {
    await professionalRepository.delete(id); // Repository handles not found error
    res.status(204).send(); 
  } catch (error) {
    console.error(`Erro ao deletar profissional ${id}:`, error);
    next(error);
  }
};

// Add Service to Professional (Placeholder - needs implementation in repository)
export const addServiceToProfessional = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.status(501).json({ message: "Not Implemented" });
};

// Remove Service from Professional (Placeholder - needs implementation in repository)
export const removeServiceFromProfessional = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.status(501).json({ message: "Not Implemented" });
};

