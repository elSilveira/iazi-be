import { Request, Response, NextFunction } from "express";
import companyRepository from "../repositories/companyRepository"; // Corrected: default import
import { Prisma, UserRole } from "@prisma/client"; // Added UserRole

// Helper function for authorization check (can be moved to middleware later)
const checkAdminRole = (req: Request, res: Response, next: NextFunction): Response | void => { // Added return type
    if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Acesso negado. Somente administradores podem realizar esta ação." });
    }
    next();
};

// Obter todas as empresas (com filtros e paginação) - Public or requires different auth?
export const getAllCompanies = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const { 
    q, category, city, state, minRating, sort, page = "1", limit = "10"
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
    // Return the response directly
    return res.status(400).json({ message: "Parâmetros de paginação inválidos (page e limit devem ser números positivos)." });
  }

  const skip = (pageNum - 1) * limitNum;

  try {
    const filters: Prisma.CompanyWhereInput = {};
    if (category) filters.categories = { has: category as string }; 
    if (q) {
      const searchTerm = q as string;
      filters.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        { categories: { has: searchTerm } }, 
        { address: { city: { contains: searchTerm, mode: "insensitive" } } },
        { address: { state: { contains: searchTerm, mode: "insensitive" } } },
      ];
    }
    
    const addressFilter: Prisma.CompanyAddressWhereInput = {};
    if (city) addressFilter.city = { contains: city as string, mode: "insensitive" };
    if (state) addressFilter.state = { contains: state as string, mode: "insensitive" };
    if (Object.keys(addressFilter).length > 0) {
        filters.address = addressFilter;
    }
    
    if (minRating) {
      const ratingNum = parseFloat(minRating as string);
      if (!isNaN(ratingNum)) {
        filters.rating = { gte: ratingNum };
      }
    }

    let orderBy: Prisma.CompanyOrderByWithRelationInput = { name: "asc" }; // Default sort
    switch (sort as string) {
      case "rating_desc":
        orderBy = { rating: "desc" }; 
        break;
      case "name_asc":
        orderBy = { name: "asc" };
        break;
    }

    const companies = await companyRepository.findMany(filters, orderBy, skip, limitNum);
    const totalCompanies = await companyRepository.count(filters);

    // Return the response
    return res.json({
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

// Obter uma empresa específica pelo ID - Public or requires different auth?
export const getCompanyById = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const { id } = req.params;
  try {
    const company = await companyRepository.findById(id);
    if (!company) {
      // Return the response directly
      return res.status(404).json({ message: "Empresa não encontrada" });
    }
    // Return the response
    return res.json(company);
  } catch (error) {
    next(error);
  }
};

// Criar uma nova empresa - Requires ADMIN role
export const createCompany = [
  checkAdminRole, // Add authorization check middleware
  async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => { 
    const { address, ...companyData } = req.body; // Destructure address and company data
    try {
      if (companyData.categories && !Array.isArray(companyData.categories)) {
          companyData.categories = [companyData.categories];
      }
      // TODO: Add ownerId based on req.user.id if schema changes
      const newCompany = await companyRepository.create(companyData, address);
      // Return the response
      return res.status(201).json(newCompany);
    } catch (error) {
      next(error);
    }
  }
];

// Atualizar uma empresa existente - Requires ADMIN role (or owner)
export const updateCompany = [
  checkAdminRole, // Add authorization check middleware (simplest approach for now)
  async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => { 
    const { id } = req.params;
    const { address, ...companyData } = req.body; // Destructure address and company data
    try {
      // TODO: Add check: if not ADMIN, verify req.user.id owns company with id `id`
      
      // Ensure company exists before attempting update (optional, repo might handle)
      const existingCompany = await companyRepository.findById(id);
      if (!existingCompany) {
          // Return the response directly
          return res.status(404).json({ message: "Empresa não encontrada para atualização." });
      }
      
      // Authorization check (placeholder for ownership)
      // if (req.user?.role !== UserRole.ADMIN && existingCompany.ownerId !== req.user?.id) {
      //     return res.status(403).json({ message: "Acesso negado." });
      // }

      if (companyData.categories && !Array.isArray(companyData.categories)) {
          companyData.categories = [companyData.categories];
      }
      // Ensure rating and totalReviews are numbers if provided
      if (companyData.rating !== undefined) companyData.rating = parseFloat(companyData.rating);
      if (companyData.totalReviews !== undefined) companyData.totalReviews = parseInt(companyData.totalReviews, 10);

      const updatedCompany = await companyRepository.update(id, companyData, address);
      // Return the response
      return res.json(updatedCompany);
    } catch (error) {
      // Handle Prisma P2025 specifically if repo doesn't
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          // Return the response directly
          return res.status(404).json({ message: "Empresa não encontrada para atualização." });
      }
      next(error);
    }
  }
];

// Deletar uma empresa - Requires ADMIN role (or owner)
export const deleteCompany = [
  checkAdminRole, // Add authorization check middleware (simplest approach for now)
  async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => { 
    const { id } = req.params;
    try {
      // TODO: Add check: if not ADMIN, verify req.user.id owns company with id `id`
      
      // Ensure company exists before attempting delete (optional, repo might handle)
      const existingCompany = await companyRepository.findById(id);
      if (!existingCompany) {
          // Return the response directly
          return res.status(404).json({ message: "Empresa não encontrada para exclusão." });
      }
      
      // Authorization check (placeholder for ownership)
      // if (req.user?.role !== UserRole.ADMIN && existingCompany.ownerId !== req.user?.id) {
      //     return res.status(403).json({ message: "Acesso negado." });
      // }

      const deletedCompany = await companyRepository.delete(id);
      // Repo delete might throw if not found, handle P2025 if needed
      // Return the response
      return res.status(200).json({ message: "Empresa excluída com sucesso", company: deletedCompany });
    } catch (error) {
       // Handle Prisma P2025 specifically if repo doesn't
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          // Return the response directly
          return res.status(404).json({ message: "Empresa não encontrada para exclusão." });
      }
      next(error);
    }
  }
];

