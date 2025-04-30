import { Router } from "express";
import {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
} from "../controllers/companyController";
import { 
  createCompanyValidator, 
  updateCompanyValidator, 
  companyIdValidator 
} from "../validators/companyValidators";
import { validateRequest } from "../middlewares/validationMiddleware";
// TODO: Adicionar middleware de autenticação/autorização para rotas protegidas

const router = Router();

// Obter todas as empresas
router.get("/", getAllCompanies);

// Obter empresa por ID
router.get("/:id", companyIdValidator, validateRequest, getCompanyById);

// Criar nova empresa
router.post("/", createCompanyValidator, validateRequest, createCompany);

// Atualizar empresa
router.put("/:id", updateCompanyValidator, validateRequest, updateCompany);

// Deletar empresa
router.delete("/:id", companyIdValidator, validateRequest, deleteCompany);

export default router;

