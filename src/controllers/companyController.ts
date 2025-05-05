import { Request, Response, NextFunction } from "express";
import companyRepository from "../repositories/companyRepository"; // Corrected: default import
import { Prisma, UserRole } from "@prisma/client"; // Added UserRole

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

// Middleware for authorization check (Admin only for now)
// TODO: Refactor into a dedicated middleware file and add Company Owner check
export const checkAdminRoleMiddleware = (req: Request, res: Response, next: NextFunction): void => { // Renamed and ensured void return
    if (req.user?.role !== UserRole.ADMIN) {
        res.status(403).json({ message: "Acesso negado. Somente administradores podem realizar esta ação." });
        return; // Stop execution
    }
    next();
};

// Middleware to check if user is Admin or owns the company
// TODO: Implement this properly when Company has an ownerId
export const checkAdminOrCompanyOwnerMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Renamed and ensured Promise<void> return
    const companyId = req.params.id || req.body.companyId;

    if (req.user?.role === UserRole.ADMIN) {
        return next(); // Admin can do anything
    }

    if (!companyId) {
        // If no companyId, only admin can proceed (e.g., creating a company)
        return checkAdminRoleMiddleware(req, res, next);
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

// Obter todas as empresas (com filtros e paginação) - Public or requires different auth?
export const getAllCompaniesHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Renamed and ensured Promise<void>
  const { 
    q, category, city, state, minRating, sort, page = "1", limit = "10"
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
    res.status(400).json({ message: "Parâmetros de paginação inválidos (page e limit devem ser números positivos)." });
    return; // Stop execution
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

// Obter uma empresa específica pelo ID - Public or requires different auth?
export const getCompanyByIdHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Renamed and ensured Promise<void>
  const { id } = req.params;
  try {
    const company = await companyRepository.findById(id);
    if (!company) {
      res.status(404).json({ message: "Empresa não encontrada" });
      return; // Stop execution
    }
    res.json(company);
  } catch (error) {
    next(error);
  }
};

// Criar uma nova empresa - Requires ADMIN role
// Main handler logic
export const createCompanyHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Renamed and ensured Promise<void>
    const { address, ...companyData } = req.body; // Destructure address and company data
    try {
      // Authorization already checked by middleware
      if (companyData.categories && !Array.isArray(companyData.categories)) {
          companyData.categories = [companyData.categories];
      }
      // TODO: Add ownerId based on req.user.id if schema changes
      const newCompany = await companyRepository.create(companyData, address);
      res.status(201).json(newCompany);
    } catch (error) {
      next(error);
    }
};

// Atualizar uma empresa existente - Requires ADMIN role (or owner)
// Main handler logic
export const updateCompanyHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Renamed and ensured Promise<void>
    const { id } = req.params;
    const { address, ...companyData } = req.body; // Destructure address and company data
    try {
      // Authorization already checked by middleware
      
      // Ensure company exists before attempting update (optional, repo might handle)
      const existingCompany = await companyRepository.findById(id);
      if (!existingCompany) {
          res.status(404).json({ message: "Empresa não encontrada para atualização." });
          return; // Stop execution
      }
      
      // Additional Authorization check (placeholder for ownership)
      // if (req.user?.role !== UserRole.ADMIN && existingCompany.ownerId !== req.user?.id) {
      //     res.status(403).json({ message: "Acesso negado." });
      //     return;
      // }

      if (companyData.categories && !Array.isArray(companyData.categories)) {
          companyData.categories = [companyData.categories];
      }
      // Ensure rating and totalReviews are numbers if provided
      if (companyData.rating !== undefined) companyData.rating = parseFloat(String(companyData.rating));
      if (companyData.totalReviews !== undefined) companyData.totalReviews = parseInt(String(companyData.totalReviews), 10);

      const updatedCompany = await companyRepository.update(id, companyData, address);
      res.json(updatedCompany);
    } catch (error) {
      // Handle Prisma P2025 specifically if repo doesn't
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          res.status(404).json({ message: "Empresa não encontrada para atualização." });
          return; // Stop execution
      }
      next(error);
    }
};

// Deletar uma empresa - Requires ADMIN role (or owner)
// Main handler logic
export const deleteCompanyHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Renamed and ensured Promise<void>
    const { id } = req.params;
    try {
      // Authorization already checked by middleware
      
      // Ensure company exists before attempting delete (optional, repo might handle)
      const existingCompany = await companyRepository.findById(id);
      if (!existingCompany) {
          res.status(404).json({ message: "Empresa não encontrada para exclusão." });
          return; // Stop execution
      }
      
      // Additional Authorization check (placeholder for ownership)
      // if (req.user?.role !== UserRole.ADMIN && existingCompany.ownerId !== req.user?.id) {
      //     res.status(403).json({ message: "Acesso negado." });
      //     return;
      // }

      const deletedCompany = await companyRepository.delete(id);
      // Repo delete might throw if not found, handle P2025 if needed
      res.status(200).json({ message: "Empresa excluída com sucesso", company: deletedCompany });
    } catch (error) {
       // Handle Prisma P2025 specifically if repo doesn't
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          res.status(404).json({ message: "Empresa não encontrada para exclusão." });
          return; // Stop execution
      }
      next(error);
    }
};

