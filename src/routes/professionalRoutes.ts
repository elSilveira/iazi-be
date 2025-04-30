import { Router } from "express";
import {
  getAllProfessionals,
  getProfessionalById,
  createProfessional,
  updateProfessional,
  deleteProfessional,
  addServiceToProfessional, // Assumindo que existe no controller
  removeServiceFromProfessional // Assumindo que existe no controller
} from "../controllers/professionalController";
import { 
  createProfessionalValidator, 
  updateProfessionalValidator, 
  professionalIdValidator,
  professionalServiceAssociationValidator
} from "../validators/professionalValidators";
import { validateRequest } from "../middlewares/validationMiddleware";
// TODO: Adicionar middleware de autenticação/autorização para rotas protegidas

const router = Router();

// Obter todos os profissionais (pode ter query param ?companyId)
router.get("/", getAllProfessionals);

// Obter profissional por ID
router.get("/:id", professionalIdValidator, validateRequest, getProfessionalById);

// Criar novo profissional
router.post("/", createProfessionalValidator, validateRequest, createProfessional);

// Atualizar profissional
router.put("/:id", updateProfessionalValidator, validateRequest, updateProfessional);

// Deletar profissional
router.delete("/:id", professionalIdValidator, validateRequest, deleteProfessional);

// Associar serviço a um profissional
router.post("/:professionalId/services", professionalServiceAssociationValidator, validateRequest, addServiceToProfessional);

// Desassociar serviço de um profissional
router.delete("/:professionalId/services/:serviceId", 
  // Reutilizar parte do validator de associação para os IDs
  [professionalIdValidator[0], serviceIdValidator[0]], 
  validateRequest, 
  removeServiceFromProfessional
);

export default router;

