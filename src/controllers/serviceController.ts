import { Request, Response, NextFunction } from "express";
import { serviceRepository } from "../repositories/serviceRepository";
import companyRepository from "../repositories/companyRepository"; // Corrected: default import
import { Prisma, UserRole } from "@prisma/client"; // Added UserRole
import { Decimal } from "@prisma/client/runtime/library"; // Import Decimal

// Define a type for the authenticated user on the request object
interface AuthenticatedUser {
    id: string;
    role: UserRole;
}

// Extend the Express Request interface
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

// Helper function for UUID validation
const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
};

// Helper function for authorization check (Admin only for now)
// TODO: Refactor into middleware and add Company Owner check
const checkAdminRole = (req: Request, res: Response, next: NextFunction): Response | void => { // Added return type
    if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Acesso negado. Somente administradores podem realizar esta ação." });
    }
    next();
};

// Helper function to check if user is Admin or owns the company associated with the service
// TODO: Implement this properly when Company has an ownerId
const checkAdminOrCompanyOwner = async (req: Request, res: Response, next: NextFunction, companyId: string): Promise<Response | void> => { // Added async and return type
    if (req.user?.role === UserRole.ADMIN) {
        return next(); // Admin can do anything
    }
    // Placeholder for owner check
    // const company = await companyRepository.findById(companyId);
    // if (company && company.ownerId === req.user?.id) {
    //     return next();
    // }
    return res.status(403).json({ message: "Acesso negado. Permissão insuficiente." });
};


// Helper function to parse decimal strings
const parseDecimal = (value: any): Decimal | undefined => {
  if (value === null || value === undefined) return undefined;
  try {
    // Ensure value is treated as string before passing to Decimal constructor if needed
    return new Prisma.Decimal(String(value)); 
  } catch (e) {
    return undefined; // Invalid decimal format
  }
};

// Obter todos os serviços (com filtros e paginação) - Public
export const getAllServices = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const { 
    companyId, category, q, minPrice, maxPrice, sort, page = "1", limit = "10"
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
    // Return the response directly
    return res.status(400).json({ message: "Parâmetros de paginação inválidos (page e limit devem ser números positivos)." });
  }

  const skip = (pageNum - 1) * limitNum;

  try {
    const filters: Prisma.ServiceWhereInput = {};
    if (companyId && typeof companyId === 'string' && isValidUUID(companyId)) filters.companyId = companyId;
    
    if (category) {
        // Assuming category query param is the ID now
        const categoryIdNum = parseInt(category as string, 10);
        if (!isNaN(categoryIdNum)) {
            filters.categoryId = categoryIdNum; // Use categoryId for filtering
        } else {
             console.warn("Invalid category ID provided: ", category);
             // Optionally return error or ignore filter
             // return res.status(400).json({ message: "Formato de categoryId inválido." });
        }
    }
    if (q) {
      const searchTerm = q as string;
      filters.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
      ];
    }
    
    const minPriceDecimal = parseDecimal(minPrice);
    const maxPriceDecimal = parseDecimal(maxPrice);

    if (minPriceDecimal !== undefined && maxPriceDecimal !== undefined) {
      if (minPriceDecimal.greaterThan(maxPriceDecimal)) {
        // Return the response directly
        return res.status(400).json({ message: "minPrice não pode ser maior que maxPrice." });
      }
      filters.price = { gte: minPriceDecimal, lte: maxPriceDecimal };
    } else if (minPriceDecimal !== undefined) {
      filters.price = { gte: minPriceDecimal };
    } else if (maxPriceDecimal !== undefined) {
      filters.price = { lte: maxPriceDecimal };
    }
    
    let orderBy: Prisma.ServiceOrderByWithRelationInput = { name: "asc" }; // Default sort
    switch (sort as string) {
      case "price_asc":
        orderBy = { price: "asc" };
        break;
      case "price_desc":
        orderBy = { price: "desc" };
        break;
      case "name_asc":
        orderBy = { name: "asc" };
        break;
    }

    const services = await serviceRepository.findMany(filters, orderBy, skip, limitNum);
    const totalServices = await serviceRepository.count(filters);

    // Return the response
    return res.json({
      data: services,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalServices / limitNum),
        totalItems: totalServices,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientValidationError) {
        console.error("Prisma Validation Error:", error.message);
        // Return the response directly
        return res.status(400).json({ message: "Erro de validação nos dados fornecidos.", details: error.message });
    } else {
        console.error("Error fetching services:", error);
        next(error); 
    }
  }
};

// Obter um serviço específico pelo ID - Public
export const getServiceById = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const { id } = req.params;
  if (!isValidUUID(id)) {
      return res.status(400).json({ message: "Formato de ID inválido." });
  }
  try {
    const service = await serviceRepository.findById(id);
    if (!service) {
      // Use return to stop execution after sending response
      return res.status(404).json({ message: "Serviço não encontrado" });
    }
    // Return the response
    return res.json(service);
  } catch (error) {
    next(error);
  }
};

// Criar um novo serviço - Requires ADMIN (or Company Owner)
export const createService = [
  checkAdminRole, // Apply admin check middleware first
  async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => { 
    // Extract data from request body
    const { name, description, price, duration, image, categoryId, companyId } = req.body;

    // --- Input Validation ---
    if (!name || !description || price === undefined || !duration || !categoryId || !companyId) {
        return res.status(400).json({ message: "Campos obrigatórios ausentes (name, description, price, duration, categoryId, companyId)." });
    }
    if (!isValidUUID(companyId)) {
        return res.status(400).json({ message: "Formato de companyId inválido." });
    }

    const priceDecimal = parseDecimal(price);
    if (priceDecimal === undefined) {
        // Use return
        return res.status(400).json({ message: "Formato de preço inválido. Use um número decimal." });
    }

    // Validate categoryId is a number
    const categoryIdNum = parseInt(categoryId, 10);
    if (isNaN(categoryIdNum)) {
        // Use return
        return res.status(400).json({ message: "categoryId inválido. Deve ser um número." });
    }
    // --- End Input Validation ---

    try {
      // Authorization check (placeholder for company owner)
      // await checkAdminOrCompanyOwner(req, res, next, companyId); // Call this if needed

      const dataToCreate: Prisma.ServiceCreateInput = {
        name,
        description,
        price: priceDecimal,
        duration,
        image,
        category: { connect: { id: categoryIdNum } }, // Use parsed number
        company: { connect: { id: companyId } },
      };

      const newService = await serviceRepository.create(dataToCreate);
      // Return the response
      return res.status(201).json(newService);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Access meta property safely
        const cause = (error.meta as { cause?: string })?.cause;
        if (error.code === 'P2025') {
          // Use return
          return res.status(400).json({ message: `Erro ao conectar: ${cause || 'Registro relacionado não encontrado (Empresa ou Categoria)'}` });
        }
      }
      next(error);
    }
  }
];

// Atualizar um serviço existente - Requires ADMIN (or Company Owner)
export const updateService = [
  // Middleware to check Admin or Company Owner based on the service being updated
  async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
      const { id } = req.params;
      if (!isValidUUID(id)) {
          return res.status(400).json({ message: "Formato de ID inválido." });
      }
      try {
          const existingService = await serviceRepository.findById(id);
          if (!existingService) {
              return res.status(404).json({ message: `Serviço com ID ${id} não encontrado.` });
          }
          // Store service for later use in the main handler
          (req as any).existingService = existingService; 
          // Check authorization based on the service's company
          await checkAdminOrCompanyOwner(req, res, next, existingService.companyId);
      } catch (error) {
          next(error);
      }
  },
  // Main handler
  async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => { 
    const { id } = req.params;
    // Extract data from request body
    const { name, description, price, duration, image, categoryId, companyId, ...otherData } = req.body;
    // Retrieve existing service stored by middleware
    const existingService = (req as any).existingService as Prisma.ServiceGetPayload<{}>;

    try {
      // Build the update payload selectively
      const updatePayload: Prisma.ServiceUpdateInput = {};
      if (name !== undefined) updatePayload.name = name;
      if (description !== undefined) updatePayload.description = description;
      if (duration !== undefined) updatePayload.duration = duration;
      if (image !== undefined) updatePayload.image = image;
      // Include any other valid fields from otherData if necessary
      // Object.assign(updatePayload, otherData); // Be careful with this

      if (price !== undefined) {
          const priceDecimal = parseDecimal(price);
          if (priceDecimal === undefined) {
              // Use return
              return res.status(400).json({ message: "Formato de preço inválido. Use um número decimal." });
          }
          updatePayload.price = priceDecimal;
      }

      if (categoryId !== undefined) {
        // Validate categoryId is a number
        const categoryIdNum = parseInt(categoryId, 10);
        if (isNaN(categoryIdNum)) {
            // Use return
            return res.status(400).json({ message: "categoryId inválido. Deve ser um número." });
        }
        updatePayload.category = { connect: { id: categoryIdNum } }; // Use parsed number
      }
      
      // Prevent changing the company
      if (companyId !== undefined && companyId !== existingService.companyId) {
          // Use return
          return res.status(400).json({ message: "Não é permitido alterar a empresa de um serviço existente." });
      }

      // Check if there's anything to update
      if (Object.keys(updatePayload).length === 0) {
          return res.status(400).json({ message: "Nenhum dado fornecido para atualização." });
      }

      const updatedService = await serviceRepository.update(id, updatePayload);
      // Return the response
      return res.json(updatedService);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
         // Access meta property safely
        const cause = (error.meta as { cause?: string })?.cause;
        if (error.code === 'P2025') {
          // Use return
          return res.status(404).json({ message: `Erro ao atualizar: ${cause || 'Registro relacionado não encontrado (Categoria)'}` });
        }
      }
      next(error);
    }
  }
];

// Deletar um serviço - Requires ADMIN (or Company Owner)
export const deleteService = [
  // Middleware to check Admin or Company Owner based on the service being deleted
  async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
      const { id } = req.params;
       if (!isValidUUID(id)) {
          return res.status(400).json({ message: "Formato de ID inválido." });
      }
      try {
          const existingService = await serviceRepository.findById(id);
          if (!existingService) {
              // Allow delete attempt even if not found, repo handles P2025
              // return res.status(404).json({ message: `Serviço com ID ${id} não encontrado.` });
          }
          // Check authorization based on the service's company (if it exists)
          await checkAdminOrCompanyOwner(req, res, next, existingService?.companyId || ''); // Pass empty string if no companyId
      } catch (error) {
          next(error);
      }
  },
  // Main handler
  async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => { 
    const { id } = req.params;
    try {
      const deletedService = await serviceRepository.delete(id);
      // Return the response
      return res.status(200).json({ message: "Serviço excluído com sucesso", service: deletedService });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          // Use return
          return res.status(404).json({ message: `Serviço com ID ${id} não encontrado.` });
      }
      next(error);
    }
  }
];

