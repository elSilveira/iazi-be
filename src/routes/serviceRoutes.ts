import { Router } from "express";
import {
  getAllServicesHandler,
  getServiceByIdHandler,
  createServiceHandler,
  updateServiceHandler,
  deleteServiceHandler,
  checkAdminRoleMiddleware,
  checkAdminOrCompanyOwnerMiddleware,
  loadExistingServiceMiddleware
} from "../controllers/serviceController";
import { 
  createServiceValidator, 
  updateServiceValidator, 
  serviceIdValidator 
} from "../validators/serviceValidators";
import { validateRequest } from "../middlewares/validationMiddleware"; // Corrected import
import asyncHandler from "../utils/asyncHandler"; // Corrected import

const router = Router();

// GET / - Get all services
router.get("/", asyncHandler(getAllServicesHandler));

// GET /:id - Get service by ID
router.get(
  "/:id", 
  serviceIdValidator[0], // Pass the single middleware function directly
  validateRequest, // Corrected: Use validateRequest
  asyncHandler(getServiceByIdHandler)
);

// POST / - Create a new service
router.post(
  "/", 
  checkAdminRoleMiddleware, // Apply auth middleware
  ...createServiceValidator, // Spread validation middlewares
  validateRequest, // Corrected: Use validateRequest
  asyncHandler(createServiceHandler)
);

// PUT /:id - Update a service
router.put(
  "/:id", 
  loadExistingServiceMiddleware, // Load service first
  checkAdminOrCompanyOwnerMiddleware, // Then check ownership/admin
  ...updateServiceValidator, // Spread validation middlewares
  validateRequest, // Corrected: Use validateRequest
  asyncHandler(updateServiceHandler)
);

// DELETE /:id - Delete a service
router.delete(
  "/:id", 
  loadExistingServiceMiddleware, // Load service first
  checkAdminOrCompanyOwnerMiddleware, // Then check ownership/admin
  serviceIdValidator[0], // Pass the single ID validation middleware directly
  validateRequest, // Corrected: Use validateRequest
  asyncHandler(deleteServiceHandler)
);

export default router;

