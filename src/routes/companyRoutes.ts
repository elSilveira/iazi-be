import { Router, Request, Response, NextFunction } from "express"; // Import Request, Response, NextFunction
import {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
} from "../controllers/companyController";
import { 
  // createCompanyValidator, // Temporarily commented out
  updateCompanyValidator, 
  companyIdValidator 
} from "../validators/companyValidators";
import { validateRequest } from "../middlewares/validationMiddleware";
import { asyncHandler } from "../utils/asyncHandler"; // Import asyncHandler
import { dummyMiddleware } from "../middlewares/dummyMiddleware"; // Import dummy middleware
// TODO: Adicionar middleware de autenticação/autorização para rotas protegidas

const router = Router();

// Aplicar asyncHandler a todas as rotas que usam funções async do controller
router.get("/", asyncHandler(getAllCompanies));

// Usar spread operator para desestruturar arrays de validadores na chamada da rota
router.get("/:id", ...companyIdValidator, validateRequest, asyncHandler(getCompanyById));

// Test: Replace validator with dummy middleware
router.post("/", dummyMiddleware, validateRequest, asyncHandler(createCompany)); // Using dummyMiddleware + validateRequest

router.put("/:id", ...updateCompanyValidator, validateRequest, asyncHandler(updateCompany));

router.delete("/:id", ...companyIdValidator, validateRequest, asyncHandler(deleteCompany));

export default router;