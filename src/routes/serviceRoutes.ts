import { Router, Request, Response, NextFunction } from "express"; // Import Request, Response, NextFunction
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
import { asyncHandler } from "../utils/asyncHandler"; // Import asyncHandler
// TODO: Adicionar middleware de autenticação/autorização para rotas protegidas (create, update, delete)

const router = Router();

// Aplicar asyncHandler e usar spread operator para arrays de validadores
router.get("/", asyncHandler(getAllServices)); 

router.get("/:id", ...serviceIdValidator, validateRequest, asyncHandler(getServiceById));

router.post("/", ...createServiceValidator, validateRequest, asyncHandler(createService));

router.put("/:id", ...updateServiceValidator, validateRequest, asyncHandler(updateService));

router.delete("/:id", ...serviceIdValidator, validateRequest, asyncHandler(deleteService));

export default router;

