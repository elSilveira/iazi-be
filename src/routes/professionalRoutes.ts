import { Router, Request, Response, NextFunction } from "express"; // Import Request, Response, NextFunction
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
import { serviceIdValidator } from "../validators/serviceValidators"; // Importar serviceIdValidator
import { validateRequest } from "../middlewares/validationMiddleware";
import { asyncHandler } from "../utils/asyncHandler"; // Import asyncHandler
// TODO: Adicionar middleware de autenticação/autorização para rotas protegidas

const router = Router();

// Aplicar asyncHandler a todas as rotas que usam funções async do controller
router.get("/", asyncHandler(getAllProfessionals));

// Usar spread operator para desestruturar arrays de validadores na chamada da rota
router.get("/:id", ...professionalIdValidator, validateRequest, asyncHandler(getProfessionalById));

router.post("/", ...createProfessionalValidator, validateRequest, asyncHandler(createProfessional));

router.put("/:id", ...updateProfessionalValidator, validateRequest, asyncHandler(updateProfessional));

router.delete("/:id", ...professionalIdValidator, validateRequest, asyncHandler(deleteProfessional));

router.post("/:professionalId/services", ...professionalServiceAssociationValidator, validateRequest, asyncHandler(addServiceToProfessional));

router.delete("/:professionalId/services/:serviceId", 
  // Usar spread operator para desestruturar arrays de validadores na chamada da rota
  ...professionalIdValidator, 
  ...serviceIdValidator, 
  validateRequest, 
  asyncHandler(removeServiceFromProfessional)
);

export default router;

