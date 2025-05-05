import { Request, Response, NextFunction } from "express";
import { professionalRepository } from "../repositories/professionalRepository";
import companyRepository from "../repositories/companyRepository"; // Import company repo for ownership check
import { Prisma, UserRole } from "@prisma/client"; // Added UserRole

// --- Authorization Helpers (Consider moving to middleware) ---

// Helper function for Admin check
const checkAdminRole = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Acesso negado. Somente administradores podem realizar esta ação." });
    }
    next();
};

// Helper function to check if user is Admin or owns the company
// Assumes Company model has an ownerId field linked to the User model
const checkAdminOrCompanyOwner = async (req: Request, res: Response, next: NextFunction, companyId: string | null | undefined) => {
    if (!companyId) {
        // If no companyId is involved (e.g., creating a professional without a company initially), only admin can do it?
        // Or adjust logic based on requirements.
        return checkAdminRole(req, res, next);
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
        return res.status(403).json({ message: "Acesso negado. Permissão insuficiente (Admin or Company Owner required)." });
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
export const getAllProfessionals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // ... (existing code for filtering and pagination) ...
  const { 
    companyId, q, role, serviceId, city, state, minRating, sort, page = "1", limit = "10"
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
export const getProfessionalById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  if (!isValidUUID(id)) {
    return res.status(400).json({ message: "Formato de ID inválido." });
  }
  try {
    const professional = await professionalRepository.findById(id);
    if (!professional) {
      return res.status(404).json({ message: "Profissional não encontrado" });
    }
    res.json(professional);
  } catch (error) {
    console.error(`Erro ao buscar profissional ${id}:`, error);
    next(error);
  }
};

// Criar um novo profissional - Requires ADMIN (or Company Owner)
export const createProfessional = [
  // Authorization Middleware/Check
  async (req: Request, res: Response, next: NextFunction) => {
      const { companyId } = req.body;
      // Use the specific helper which checks Admin OR Owner (if implemented)
      // For now, using Admin only as owner logic is pending schema change
      await checkAdminOrCompanyOwner(req, res, next, companyId);
  },
  // Main Controller Logic
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { name: reqName, role: reqRole, image, companyId, serviceIds, bio, phone } = req.body;

    const professionalName = reqName;
    if (!professionalName) {
      return res.status(400).json({ message: "Nome do profissional não fornecido." });
    }
    const professionalRole = reqRole || "Profissional";

    try {
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
          return res.status(400).json({ message: `Erro ao conectar: ${error.meta?.cause || 'Registro relacionado não encontrado (ex: Empresa não existe)'}` });
        }
      }
      next(error);
    }
  }
];

// Atualizar um profissional existente - Requires ADMIN (or Company Owner)
export const updateProfessional = [
  // Authorization Middleware/Check
  async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      try {
          const professional = await professionalRepository.findById(id);
          if (!professional) {
              return res.status(404).json({ message: "Profissional não encontrado." });
          }
          // Check permission based on the professional's associated company
          await checkAdminOrCompanyOwner(req, res, next, professional.companyId);
      } catch (error) {
          next(error);
      }
  },
  // Main Controller Logic
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { companyId, serviceIds, ...dataToUpdate } = req.body;

    try {
      if (dataToUpdate.rating !== undefined && typeof dataToUpdate.rating === 'string') {
        dataToUpdate.rating = parseFloat(dataToUpdate.rating);
      }
      if (dataToUpdate.totalReviews !== undefined && typeof dataToUpdate.totalReviews === 'string') {
        dataToUpdate.totalReviews = parseInt(dataToUpdate.totalReviews, 10);
      }

      delete dataToUpdate.companyId; 
      delete dataToUpdate.serviceIds;

      const updatedProfessional = await professionalRepository.update(id, dataToUpdate as Prisma.ProfessionalUpdateInput, serviceIds as string[] | undefined);
      res.json(updatedProfessional); 
    } catch (error) {
      console.error(`Erro ao atualizar profissional ${id}:`, error);
      // Handle P2025 from repo update if needed
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          return res.status(404).json({ message: `Erro ao atualizar: ${error.meta?.cause || 'Profissional não encontrado'}` });
      }
      next(error);
    }
  }
];

// Deletar um profissional - Requires ADMIN (or Company Owner)
export const deleteProfessional = [
  // Authorization Middleware/Check
  async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      try {
          const professional = await professionalRepository.findById(id);
          if (!professional) {
              // Allow deletion attempt even if not found, repo handles P2025
              // return res.status(404).json({ message: "Profissional não encontrado." });
          }
          // Check permission based on the professional's associated company (if exists)
          await checkAdminOrCompanyOwner(req, res, next, professional?.companyId);
      } catch (error) {
          next(error);
      }
  },
  // Main Controller Logic
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    try {
      await professionalRepository.delete(id); 
      res.status(204).send(); 
    } catch (error) {
      console.error(`Erro ao deletar profissional ${id}:`, error);
      // Handle P2025 from repo delete
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          return res.status(404).json({ message: `Erro ao deletar: ${error.meta?.cause || 'Profissional não encontrado'}` });
      }
      next(error);
    }
  }
];

// Add Service to Professional - Requires ADMIN (or Company Owner)
export const addServiceToProfessional = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // TODO: Implement authorization check based on professional's company
    res.status(501).json({ message: "Not Implemented" });
};

// Remove Service from Professional - Requires ADMIN (or Company Owner)
export const removeServiceFromProfessional = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // TODO: Implement authorization check based on professional's company
    res.status(501).json({ message: "Not Implemented" });
};

