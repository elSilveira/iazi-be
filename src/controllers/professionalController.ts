import { Request, Response, NextFunction } from "express";
import { professionalRepository } from "../repositories/professionalRepository";
import { Prisma } from "@prisma/client";

// Assume an interface for the authenticated user attached by middleware
interface AuthenticatedUser {
  id: string;
  // name: string; // Temporarily removed for consistency with authMiddleware
  // Add other relevant user properties if available
}

// Extend the Express Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: { id: string }; // Consistent with authMiddleware
    }
  }
}

// Helper function for UUID validation
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
};

// Obter todos os profissionais (com filtros e paginação)
export const getAllProfessionals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // ... (existing code for getAllProfessionals remains the same)
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

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
    res.status(400).json({ message: "Parâmetros de paginação inválidos (page e limit devem ser números positivos)." });
    return;
  }

  const skip = (pageNum - 1) * limitNum;

  try {
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
    
    const companyFilter: Prisma.CompanyWhereInput = {};
    const addressFilter: Prisma.CompanyAddressWhereInput = {}; 
    if (city) addressFilter.city = { contains: city as string, mode: "insensitive" };
    if (state) addressFilter.state = { contains: state as string, mode: "insensitive" };
    if (Object.keys(addressFilter).length > 0) {
        companyFilter.address = addressFilter;
        filters.company = companyFilter;
    }
    
    if (minRating) {
      const ratingNum = parseFloat(minRating as string);
      if (!isNaN(ratingNum)) {
        filters.rating = { gte: ratingNum };
      }
    }

    let orderBy: Prisma.ProfessionalOrderByWithRelationInput = {};
    switch (sort as string) {
      case "rating_desc":
        orderBy = { rating: "desc" }; 
        break;
      case "name_asc":
        orderBy = { name: "asc" };
        break;
      default:
        orderBy = { name: "asc" }; 
    }

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
  // ... (existing code for getProfessionalById remains the same)
  const { id } = req.params;
  if (!isValidUUID(id)) {
    res.status(400).json({ message: "Formato de ID inválido." });
    return;
  }
  try {
    const professional = await professionalRepository.findById(id);
    if (!professional) {
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
  // Destructure potentially optional fields
  const { name: reqName, role: reqRole, image, companyId, serviceIds, bio, phone } = req.body;

  // **Important:** Authentication middleware should run before this controller
  // and attach the user object to req.user
  const authenticatedUser = req.user;

  // Determine the name: use request body, fallback to authenticated user's name
  const professionalName = reqName;
  if (!professionalName) {
    // If name is still missing (e.g., user not authenticated or name not in user object)
    res.status(400).json({ message: "Nome do profissional não fornecido e não pôde ser obtido do usuário autenticado." });
    return;
  }

  // Determine the role: use request body, fallback to default
  const professionalRole = reqRole || "Profissional"; // Default role

  try {
    const dataToCreate: Prisma.ProfessionalCreateInput = {
      name: professionalName,
      role: professionalRole,
      image: image, // Already optional based on validator
      // Conditionally connect company only if companyId is provided and valid
      ...(companyId && isValidUUID(companyId) && { company: { connect: { id: companyId } } }),
      // Include other optional fields if provided
      // Assuming Prisma schema matches these fields (bio, phone)
      // Note: The Professional model in the provided schema doesn't have bio/phone directly
      // These might belong to the User model instead. Adjust accordingly.
      // bio: bio, 
      // phone: phone,
      // Rating and totalReviews have defaults
    };

    // Pass serviceIds if provided (repository handles association)
    const newProfessional = await professionalRepository.create(dataToCreate, serviceIds as string[] | undefined);
    res.status(201).json(newProfessional);
  } catch (error) {
    console.error("Erro ao criar profissional:", error);
    // Handle potential Prisma errors (e.g., companyId not found if provided)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') { // Foreign key constraint failed
        res.status(400).json({ message: `Erro ao conectar: ${error.meta?.cause || 'Registro relacionado não encontrado (ex: Empresa não existe)'}` });
        return;
      }
    }
    next(error);
  }
};

// Atualizar um profissional existente
export const updateProfessional = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // ... (existing code for updateProfessional remains the same, ensure it handles optional fields correctly)
  const { id } = req.params;
  const { companyId, serviceIds, ...dataToUpdate } = req.body;

  try {
    // Ensure numeric fields are parsed correctly if sent as strings
    if (dataToUpdate.rating !== undefined && typeof dataToUpdate.rating === 'string') {
      dataToUpdate.rating = parseFloat(dataToUpdate.rating);
    }
    if (dataToUpdate.totalReviews !== undefined && typeof dataToUpdate.totalReviews === 'string') {
      dataToUpdate.totalReviews = parseInt(dataToUpdate.totalReviews, 10);
    }

    // Remove fields that shouldn't be updated directly or are handled separately
    delete dataToUpdate.companyId; // Usually not updated here
    delete dataToUpdate.serviceIds; // Handled by repository logic

    const updatedProfessional = await professionalRepository.update(id, dataToUpdate as Prisma.ProfessionalUpdateInput, serviceIds as string[] | undefined);
    res.json(updatedProfessional); 
  } catch (error) {
    console.error(`Erro ao atualizar profissional ${id}:`, error);
    next(error);
  }
};

// Deletar um profissional
export const deleteProfessional = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // ... (existing code for deleteProfessional remains the same)
  const { id } = req.params;

  try {
    await professionalRepository.delete(id); 
    res.status(204).send(); 
  } catch (error) {
    console.error(`Erro ao deletar profissional ${id}:`, error);
    next(error);
  }
};

// Add Service to Professional (Placeholder)
export const addServiceToProfessional = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.status(501).json({ message: "Not Implemented" });
};

// Remove Service from Professional (Placeholder)
export const removeServiceFromProfessional = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.status(501).json({ message: "Not Implemented" });
};

