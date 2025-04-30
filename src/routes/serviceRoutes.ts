import { Router } from "express";
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "../controllers/serviceController";
import { 
  createServiceValidator, 
  updateServiceValidator, 
  serviceIdValidator 
} from "../validators/serviceValidators";
import { validateRequest } from "../middlewares/validationMiddleware";
// TODO: Adicionar middleware de autenticação/autorização para rotas protegidas (create, update, delete)

const router = Router();

// Obter todos os serviços (pode ter query param ?companyId)
router.get("/", getAllServices); // Validação de query param pode ser adicionada se necessário

// Obter serviço por ID
router.get("/:id", serviceIdValidator, validateRequest, getServiceById);

// Criar novo serviço
router.post("/", createServiceValidator, validateRequest, createService);

// Atualizar serviço
router.put("/:id", updateServiceValidator, validateRequest, updateService);

// Deletar serviço
router.delete("/:id", serviceIdValidator, validateRequest, deleteService);

export default router;

