import { Request, Response, NextFunction } from "express";
import { professionalRepository } from "../repositories/professionalRepository";
import companyRepository from "../repositories/companyRepository"; // Import company repo for ownership check
import { Prisma, UserRole } from "@prisma/client"; // Added UserRole

// --- Authorization Helpers (Consider moving to middleware) ---

// Middleware for Admin check
export const checkAdminRoleMiddleware = (req: Request, res: Response, next: NextFunction): void => { // Renamed and ensured void return
    if (req.user?.role !== UserRole.ADMIN) {
        res.status(403).json({ message: "Acesso negado. Somente administradores podem realizar esta ação." });
        return; // Stop execution
    }
    next();
};

// Middleware to check if user is Admin or owns the company
// Assumes Company model has an ownerId field linked to the User model
export const checkAdminOrCompanyOwnerMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Renamed and ensured Promise<void> return
    let companyId: string | null | undefined = req.params.companyId || req.body.companyId;

    // If checking for an existing professional, get companyId from them
    if (req.params.id && !companyId) {
        try {
            const professional = await professionalRepository.findById(req.params.id);
            companyId = professional?.companyId;
        } catch (error) {
            // Handle error if professional not found or other DB issue
            return next(error);
        }
    }

    if (!companyId) {
        // If no companyId is involved, allow any authenticated user (authMiddleware should have run)
        return next(); 
    }

    if (req.user?.role === UserRole.ADMIN) {
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
    } catch (error) {
        next(error);
    }
};

// --- End Authorization Helpers ---


// Assume an interface for the authenticated user attached by middleware
interface AuthenticatedUser {
  id: string;
  role: UserRole; // Added role
}

// Extend the Express Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser; // Use the defined interface
    }
  }
}

// Helper function for UUID validation
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
};

// Obter todos os profissionais (com filtros e paginação) - Public
export const getAllProfessionalsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Renamed and ensured Promise<void>
  const { 
    companyId, q, role, serviceId, city, state, minRating, sort, page = "1", limit = "10"
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
    res.status(400).json({ message: "Parâmetros de paginação inválidos (page e limit devem ser números positivos)." });
    return; // Stop execution
  }

  const skip = (pageNum - 1) * limitNum;

  try {
    const filters: Prisma.ProfessionalWhereInput = {};
    if (companyId && typeof companyId === 'string' && isValidUUID(companyId)) filters.companyId = companyId;
    if (role) filters.role = { contains: role as string, mode: "insensitive" };
    if (serviceId && typeof serviceId === 'string' && isValidUUID(serviceId)) {
      filters.services = {
        some: { serviceId: serviceId }
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

    let orderBy: Prisma.ProfessionalOrderByWithRelationInput = { name: "asc" }; // Default sort
    switch (sort as string) {
      case "rating_desc":
        orderBy = { rating: "desc" }; 
        break;
      case "name_asc":
        orderBy = { name: "asc" };
        break;
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

// Obter um profissional específico pelo ID - Public
export const getProfessionalByIdHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Renamed and ensured Promise<void>
  const { id } = req.params;
  if (!isValidUUID(id)) {
    res.status(400).json({ message: "Formato de ID inválido." });
    return; // Stop execution
  }
  try {
    const professional = await professionalRepository.findById(id);
    if (!professional) {
      res.status(404).json({ message: "Profissional não encontrado" });
      return; // Stop execution
    }
    res.json(professional);
  } catch (error) {
    console.error(`Erro ao buscar profissional ${id}:`, error);
    next(error);
  }
};

// Criar um novo profissional - Requires ADMIN (or Company Owner)
// Main handler logic
export const createProfessionalHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Renamed and ensured Promise<void>
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
      const dataToCreate: Prisma.ProfessionalCreateInput = {
        name: professionalName,
        role: professionalRole,
        image: image,
        ...(companyId && isValidUUID(companyId) && { company: { connect: { id: companyId } } }),
        // bio: bio, // Removed: Not in schema
        // phone: phone, // Removed: Not in schema
      };

      const newProfessional = await professionalRepository.create(dataToCreate, serviceIds as string[] | undefined);
      res.status(201).json(newProfessional);
    } catch (error) {
      console.error("Erro ao criar profissional:", error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          res.status(400).json({ message: `Erro ao conectar: ${error.meta?.cause || 'Registro relacionado não encontrado (ex: Empresa não existe)'}` });
          return; // Stop execution
        }
      }
      next(error);
    }
};

// Atualizar um profissional existente - Requires ADMIN (or Company Owner)
// Main handler logic
export const updateProfessionalHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Renamed and ensured Promise<void>
    const { id } = req.params;
    // Extract data from request body, excluding fields handled separately
    const { serviceIds, ...dataToUpdate } = req.body;

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

      const updatedProfessional = await professionalRepository.update(id, dataToUpdate as Prisma.ProfessionalUpdateInput, serviceIds as string[] | undefined);
      res.json(updatedProfessional); 
    } catch (error) {
      console.error(`Erro ao atualizar profissional ${id}:`, error);
      // Handle P2025 from repo update if needed
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          res.status(404).json({ message: `Erro ao atualizar: ${error.meta?.cause || 'Profissional não encontrado'}` });
          return; // Stop execution
      }
      next(error);
    }
};

// Deletar um profissional - Requires ADMIN (or Company Owner)
// Main handler logic
export const deleteProfessionalHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Renamed and ensured Promise<void>
    const { id } = req.params;
    try {
      // Authorization already checked by middleware
      await professionalRepository.delete(id); 
      res.status(204).send(); 
    } catch (error) {
      console.error(`Erro ao deletar profissional ${id}:`, error);
      // Handle P2025 from repo delete
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          res.status(404).json({ message: `Erro ao deletar: ${error.meta?.cause || 'Profissional não encontrado'}` });
          return; // Stop execution
      }
      next(error);
    }
};

// Add Service to Professional - Requires ADMIN (or Company Owner)
export const addServiceToProfessionalHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Renamed and ensured Promise<void>
    const { professionalId, serviceId } = req.params;
    // TODO: Implement authorization check based on professional's company
    // TODO: Implement logic using professionalRepository.addService or similar
    res.status(501).json({ message: "Not Implemented" });
    return;
};

// Remove Service from Professional - Requires ADMIN (or Company Owner)
export const removeServiceFromProfessionalHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Renamed and ensured Promise<void>
    const { professionalId, serviceId } = req.params;
    // TODO: Implement authorization check based on professional's company
    // TODO: Implement logic using professionalRepository.removeService or similar
    res.status(501).json({ message: "Not Implemented" });
    return;
};

