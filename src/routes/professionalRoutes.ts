import { Router } from "express";
import {
  getAllProfessionalsHandler,
  getProfessionalByIdHandler,
  createProfessionalHandler,
  updateProfessionalHandler,
  deleteProfessionalHandler,
  addServiceToProfessionalHandler,
  removeServiceFromProfessionalHandler,
  checkAdminOrCompanyOwnerMiddleware // Import middleware
} from "../controllers/professionalController";
import { 
  createProfessionalValidator, 
  updateProfessionalValidator, 
  professionalIdValidator,
  professionalServiceAssociationValidator
} from "../validators/professionalValidators";
import { serviceIdValidator } from "../validators/serviceValidators";
import { validateRequest } from "../middlewares/validationMiddleware";
import asyncHandler from "../utils/asyncHandler"; // Corrected import

const router = Router();

// GET / - Get all professionals
router.get("/", asyncHandler(getAllProfessionalsHandler));

// GET /:id - Get professional by ID
router.get(
  "/:id", 
  professionalIdValidator[0], // Pass the single middleware function directly
  validateRequest, 
  asyncHandler(getProfessionalByIdHandler)
);

// POST / - Create a new professional
router.post(
  "/", 
  checkAdminOrCompanyOwnerMiddleware, // Apply auth middleware
  ...createProfessionalValidator, // Spread validation middlewares
  validateRequest, 
  asyncHandler(createProfessionalHandler)
);

// PUT /:id - Update a professional
router.put(
  "/:id", 
  checkAdminOrCompanyOwnerMiddleware, // Apply auth middleware
  ...updateProfessionalValidator, // Spread validation middlewares
  validateRequest, 
  asyncHandler(updateProfessionalHandler)
);

// DELETE /:id - Delete a professional
router.delete(
  "/:id", 
  checkAdminOrCompanyOwnerMiddleware, // Apply auth middleware
  professionalIdValidator[0], // Pass the single middleware function directly
  validateRequest, 
  asyncHandler(deleteProfessionalHandler)
);

// POST /:professionalId/services - Associate a service with a professional
router.post(
  "/:professionalId/services", 
  checkAdminOrCompanyOwnerMiddleware, // Apply auth middleware (checks based on professionalId)
  ...professionalServiceAssociationValidator, // Spread validation middlewares
  validateRequest, 
  asyncHandler(addServiceToProfessionalHandler)
);

// DELETE /:professionalId/services/:serviceId - Disassociate a service from a professional
router.delete(
  "/:professionalId/services/:serviceId", 
  checkAdminOrCompanyOwnerMiddleware, // Apply auth middleware (checks based on professionalId)
  professionalIdValidator[0], // Pass the single middleware function directly
  serviceIdValidator[0],      // Pass the single middleware function directly
  validateRequest, 
  asyncHandler(removeServiceFromProfessionalHandler)
);

export default router;

