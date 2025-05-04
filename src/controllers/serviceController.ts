import { Request, Response, NextFunction } from "express";
import { serviceRepository } from "../repositories/serviceRepository";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library"; // Import Decimal

// Helper function to parse decimal strings
const parseDecimal = (value: any): Decimal | undefined => {
  if (value === null || value === undefined) return undefined;
  try {
    return new Prisma.Decimal(value);
  } catch (e) {
    return undefined; // Invalid decimal format
  }
};

// Obter todos os serviços (com filtros e paginação)
export const getAllServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Extrair filtros e paginação da query string
  const { 
    companyId, 
    category, // Category name filter
    q, // Search term
    minPrice, 
    maxPrice, 
    // minRating, // Rating is not directly on Service model
    sort, // e.g., "price_asc", "price_desc", "name_asc"
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
    const filters: Prisma.ServiceWhereInput = {};
    if (companyId) filters.companyId = companyId as string;
    if (category) filters.category = { name: { contains: category as string, mode: "insensitive" } }; 
    if (q) {
      const searchTerm = q as string;
      filters.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        { category: { name: { contains: searchTerm, mode: "insensitive" } } },
        { company: { name: { contains: searchTerm, mode: "insensitive" } } },
      ];
    }
    
    // --- Implement Price Filters (Decimal) ---
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
    // --- End Price Filters ---
    
    // Construir objeto de ordenação para Prisma
    let orderBy: Prisma.ServiceOrderByWithRelationInput = {};
    switch (sort as string) {
      // case "rating_desc": // Rating not on service
      //   break;
      case "price_asc":
        orderBy = { price: "asc" }; // Now sorts numerically
        break;
      case "price_desc":
        orderBy = { price: "desc" }; // Now sorts numerically
        break;
      case "name_asc":
        orderBy = { name: "asc" };
        break;
      default:
        orderBy = { name: "asc" }; // Default sort
    }

    // Assume repository methods exist
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
    // Add more specific error handling if needed
    if (error instanceof Prisma.PrismaClientValidationError) {
        console.error("Prisma Validation Error:", error.message);
        res.status(400).json({ message: "Erro de validação nos dados fornecidos.", details: error.message });
    } else {
        console.error("Error fetching services:", error);
        next(error); 
    }
  }
};

// Obter um serviço específico pelo ID
export const getServiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const service = await serviceRepository.findById(id);
    if (!service) {
      const error: any = new Error("Serviço não encontrado");
      error.statusCode = 404;
      return next(error);
    }
    res.json(service);
  } catch (error) {
    next(error);
  }
};

// Criar um novo serviço
export const createService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { name, description, price, duration, image, categoryId, companyId } = req.body; 

  // --- Validate Price --- 
  const priceDecimal = parseDecimal(price);
  if (priceDecimal === undefined) {
      res.status(400).json({ message: "Formato de preço inválido. Use um número decimal." });
      return;
  }
  // --- End Price Validation ---

  try {
    // Validate categoryId exists if provided?
    const categoryIdNum = parseInt(categoryId, 10);
    if (isNaN(categoryIdNum)) {
        res.status(400).json({ message: "categoryId inválido." });
        return;
    }

    const dataToCreate: Prisma.ServiceCreateInput = {
      name,
      description,
      price: priceDecimal, // Use validated Decimal
      duration, // String as per schema
      image,
      category: { connect: { id: categoryIdNum } }, 
      company: { connect: { id: companyId } },
    };

    const newService = await serviceRepository.create(dataToCreate);
    res.status(201).json(newService);
  } catch (error) {
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle foreign key constraint errors (e.g., companyId or categoryId not found)
      if (error.code === 'P2025') {
        res.status(400).json({ message: `Erro ao conectar: ${error.meta?.cause || 'Registro relacionado não encontrado (Empresa ou Categoria)'}` });
        return;
      }
    }
    next(error);
  }
};

// Atualizar um serviço existente
export const updateService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { companyId, categoryId, price, ...dataToUpdate } = req.body;

  try {
    const updatePayload: Prisma.ServiceUpdateInput = { ...dataToUpdate };

    // --- Validate and Update Price --- 
    if (price !== undefined) {
        const priceDecimal = parseDecimal(price);
        if (priceDecimal === undefined) {
            res.status(400).json({ message: "Formato de preço inválido. Use um número decimal." });
            return;
        }
        updatePayload.price = priceDecimal;
    }
    // --- End Price Validation ---

    if (categoryId !== undefined) {
      const categoryIdNum = parseInt(categoryId, 10);
      if (isNaN(categoryIdNum)) {
          res.status(400).json({ message: "categoryId inválido." });
          return;
      }
      updatePayload.category = { connect: { id: categoryIdNum } };
    }

    const updatedService = await serviceRepository.update(id, updatePayload);
    res.json(updatedService);
  } catch (error) {
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle record not found or other Prisma errors
      if (error.code === 'P2025') {
        res.status(404).json({ message: `Serviço com ID ${id} não encontrado ou erro ao conectar categoria.` });
        return;
      }
    }
    next(error);
  }
};

// Deletar um serviço
export const deleteService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const deletedService = await serviceRepository.delete(id);
    res.status(200).json({ message: "Serviço excluído com sucesso", service: deletedService });
  } catch (error) {
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        res.status(404).json({ message: `Serviço com ID ${id} não encontrado.` });
        return;
    }
    next(error);
  }
};

