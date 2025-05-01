import { Request, Response, NextFunction } from "express";
import { serviceRepository } from "../repositories/serviceRepository";
import { Prisma } from "@prisma/client";

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
    // Corrected: Don't return void, just send response
    res.status(400).json({ message: "Parâmetros de paginação inválidos (page e limit devem ser números positivos)." });
    return;
  }

  const skip = (pageNum - 1) * limitNum;

  try {
    // Construir objeto de filtros para Prisma
    const filters: Prisma.ServiceWhereInput = {};
    if (companyId) filters.companyId = companyId as string;
    // Corrected: Filter by category name through relation
    if (category) filters.category = { name: { contains: category as string, mode: "insensitive" } }; 
    if (q) {
      const searchTerm = q as string;
      filters.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        // Corrected: Search in category name through relation
        { category: { name: { contains: searchTerm, mode: "insensitive" } } },
        // Add search in company name if needed via relations
        { company: { name: { contains: searchTerm, mode: "insensitive" } } },
      ];
    }
    // Add price filters (assuming price is stored as String, requires careful comparison or schema change)
    // This is complex with string prices. For now, skipping price filtering.
    // Consider changing schema `price` to Decimal or Float for proper filtering.
    // if (minPrice) { /* Logic for string price comparison >= minPrice */ }
    // if (maxPrice) { /* Logic for string price comparison <= maxPrice */ }
    
    // Construir objeto de ordenação para Prisma
    let orderBy: Prisma.ServiceOrderByWithRelationInput = {};
    switch (sort as string) {
      // case "rating_desc": // Rating not on service
      //   break;
      case "price_asc":
        orderBy = { price: "asc" }; // Sorting string price might be lexicographical, not numerical
        break;
      case "price_desc":
        orderBy = { price: "desc" }; // Sorting string price might be lexicographical, not numerical
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
    next(error); 
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
  // Corrected: Use `duration` (String) as per schema, not durationMinutes
  const { name, description, price, duration, image, categoryId, companyId } = req.body; 

  try {
    // Validate categoryId exists if provided?
    const dataToCreate: Prisma.ServiceCreateInput = {
      name,
      description,
      price, // String as per schema
      duration, // String as per schema
      image,
      category: { connect: { id: parseInt(categoryId, 10) } }, // Connect by category ID (assuming it's Int)
      company: { connect: { id: companyId } },
    };

    const newService = await serviceRepository.create(dataToCreate);
    res.status(201).json(newService);
  } catch (error) {
    next(error);
  }
};

// Atualizar um serviço existente
export const updateService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  // Corrected: Use `duration` (String), handle categoryId update
  const { companyId, categoryId, ...dataToUpdate } = req.body;

  try {
    // Prepare update data, connect category if categoryId is provided
    const updatePayload: Prisma.ServiceUpdateInput = { ...dataToUpdate };
    if (categoryId !== undefined) {
      updatePayload.category = { connect: { id: parseInt(categoryId, 10) } };
    }
    // Price and duration are strings, no conversion needed unless schema changes

    const updatedService = await serviceRepository.update(id, updatePayload);
    res.json(updatedService);
  } catch (error) {
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
    next(error);
  }
};

