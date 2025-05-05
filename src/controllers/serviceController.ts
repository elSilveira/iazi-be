import { Request, Response, NextFunction } from "express";
import { serviceRepository } from "../repositories/serviceRepository";
import { companyRepository } from "../repositories/companyRepository"; // Import company repo for ownership check
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

// Helper function for authorization check (Admin only for now)
// TODO: Refactor into middleware and add Company Owner check
const checkAdminRole = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Acesso negado. Somente administradores podem realizar esta ação." });
    }
    next();
};

// Helper function to check if user is Admin or owns the company associated with the service
// TODO: Implement this properly when Company has an ownerId
const checkAdminOrCompanyOwner = async (req: Request, res: Response, next: NextFunction, companyId: string) => {
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
export const getAllServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { 
    companyId, category, q, minPrice, maxPrice, sort, page = "1", limit = "10"
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
    res.status(400).json({ message: "Parâmetros de paginação inválidos (page e limit devem ser números positivos)." });
    return;
  }

  const skip = (pageNum - 1) * limitNum;

  try {
    const filters: Prisma.ServiceWhereInput = {};
    if (companyId) filters.companyId = companyId as string; // Cast companyId to string
    
    if (category) {
        // Assuming category query param is the ID now
        const categoryIdNum = parseInt(category as string, 10);
        if (!isNaN(categoryIdNum)) {
            filters.categoryId = categoryIdNum; // Use categoryId for filtering
        } else {
            // Fallback to name search if needed, but ID is preferred
            // filters.category = { name: { contains: category as string, mode: "insensitive" } }; // Removed category name filter for simplicity/consistency
             console.warn("Invalid category ID provided, filtering by category name is not supported currently.");
        }
    }
    if (q) {
      const searchTerm = q as string;
      filters.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        // { category: { name: { contains: searchTerm, mode: "insensitive" } } }, // Filter by category name removed
        // { company: { name: { contains: searchTerm, mode: "insensitive" } } }, // Filter by company name removed for simplicity
      ];
    }
    
    const minPriceDecimal = parseDecimal(minPrice);
    const maxPriceDecimal = parseDecimal(maxPrice);

    if (minPriceDecimal !== undefined && maxPriceDecimal !== undefined) {
      if (minPriceDecimal.greaterThan(maxPriceDecimal)) {
        res.status(400).json({ message: "minPrice não pode ser maior que maxPrice." });
        return;
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

    res.json({
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
        res.status(400).json({ message: "Erro de validação nos dados fornecidos.", details: error.message });
    } else {
        console.error("Error fetching services:", error);
        next(error); 
    }
  }
};

// Obter um serviço específico pelo ID - Public
export const getServiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const service = await serviceRepository.findById(id);
    if (!service) {
      // Use return to stop execution after sending response
      return res.status(404).json({ message: "Serviço não encontrado" });
    }
    res.json(service);
  } catch (error) {
    next(error);
  }
};

// Criar um novo serviço - Requires ADMIN (or Company Owner)
export const createService = [
  checkAdminRole,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { name, description, price, duration, image, categoryId, companyId } = req.body; 

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

    try {
      // Authorization check (handled by middleware)

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
      res.status(201).json(newService);
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
  checkAdminRole,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { companyId, categoryId, price, ...dataToUpdate } = req.body;

    try {
      const existingService = await serviceRepository.findById(id);
      if (!existingService) {
          // Use return
          return res.status(404).json({ message: `Serviço com ID ${id} não encontrado.` });
      }

      // Authorization check (handled by middleware)

      const updatePayload: Prisma.ServiceUpdateInput = { ...dataToUpdate };

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
      
      if (companyId !== undefined && companyId !== existingService.companyId) {
          // Use return
          return res.status(400).json({ message: "Não é permitido alterar a empresa de um serviço existente." });
      }

      const updatedService = await serviceRepository.update(id, updatePayload);
      res.json(updatedService);
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
  checkAdminRole,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    try {
      const existingService = await serviceRepository.findById(id);
      if (!existingService) {
          // Use return
          return res.status(404).json({ message: `Serviço com ID ${id} não encontrado.` });
      }

      // Authorization check (handled by middleware)

      const deletedService = await serviceRepository.delete(id);
      res.status(200).json({ message: "Serviço excluído com sucesso", service: deletedService });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          // Use return
          return res.status(404).json({ message: `Serviço com ID ${id} não encontrado.` });
      }
      next(error);
    }
  }
];

