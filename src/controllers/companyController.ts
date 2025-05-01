import { Request, Response, NextFunction } from "express";
import { companyRepository } from "../repositories/companyRepository";
import { Prisma } from "@prisma/client";

// Obter todas as empresas (com filtros e paginação)
export const getAllCompanies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Extrair filtros e paginação da query string
  const { 
    q, // Search term
    category, // Filter by category (from categories array)
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
    const filters: Prisma.CompanyWhereInput = {};
    if (category) filters.categories = { has: category as string }; 
    if (q) {
      const searchTerm = q as string;
      filters.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        { categories: { has: searchTerm } }, 
        // Add search in address fields
        { address: { city: { contains: searchTerm, mode: "insensitive" } } },
        { address: { state: { contains: searchTerm, mode: "insensitive" } } },
      ];
    }
    
    // Corrected: Add location filters properly
    const addressFilter: Prisma.AddressWhereInput = {};
    if (city) addressFilter.city = { contains: city as string, mode: "insensitive" };
    if (state) addressFilter.state = { contains: state as string, mode: "insensitive" };
    // Only add the address filter if city or state was provided
    if (Object.keys(addressFilter).length > 0) {
        filters.address = addressFilter;
    }
    
    // Add rating filter (schema has rating as Float)
    if (minRating) {
      const ratingNum = parseFloat(minRating as string);
      if (!isNaN(ratingNum)) {
        filters.rating = { gte: ratingNum };
      }
    }

    // Construir objeto de ordenação para Prisma
    let orderBy: Prisma.CompanyOrderByWithRelationInput = {};
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
    const companies = await companyRepository.findMany(filters, orderBy, skip, limitNum);
    const totalCompanies = await companyRepository.count(filters);

    res.json({
      data: companies,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCompanies / limitNum),
        totalItems: totalCompanies,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    next(error); 
  }
};

// Obter uma empresa específica pelo ID
export const getCompanyById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const company = await companyRepository.findById(id);
    if (!company) {
      const error: any = new Error("Empresa não encontrada");
      error.statusCode = 404;
      return next(error);
    }
    res.json(company);
  } catch (error) {
    next(error);
  }
};

// Criar uma nova empresa
export const createCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { address, ...companyData } = req.body;
  try {
    if (companyData.categories && !Array.isArray(companyData.categories)) {
        companyData.categories = [companyData.categories];
    }
    const newCompany = await companyRepository.create(companyData, address);
    res.status(201).json(newCompany);
  } catch (error) {
    next(error);
  }
};

// Atualizar uma empresa existente
export const updateCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { address, ...companyData } = req.body;
  try {
    if (companyData.categories && !Array.isArray(companyData.categories)) {
        companyData.categories = [companyData.categories];
    }
    if (companyData.rating !== undefined) companyData.rating = parseFloat(companyData.rating);
    if (companyData.totalReviews !== undefined) companyData.totalReviews = parseInt(companyData.totalReviews, 10);

    const updatedCompany = await companyRepository.update(id, companyData, address);
    res.json(updatedCompany);
  } catch (error) {
    next(error);
  }
};

// Deletar uma empresa
export const deleteCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const deletedCompany = await companyRepository.delete(id);
    res.status(200).json({ message: "Empresa excluída com sucesso", company: deletedCompany });
  } catch (error) {
    next(error);
  }
};

