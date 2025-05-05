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
import { handleValidationErrors } from "../middlewares/validationMiddleware";
import asyncHandler from "../utils/asyncHandler"; // Corrected import

const router = Router();

// GET / - Get all services
router.get("/", asyncHandler(getAllServicesHandler));

// GET /:id - Get service by ID
router.get(
  "/:id", 
  serviceIdValidator[0], // Pass the single middleware function directly
  handleValidationErrors, // Corrected: Use handleValidationErrors
  asyncHandler(getServiceByIdHandler)
);

// POST / - Create a new service
router.post(
  "/", 
  checkAdminRoleMiddleware, // Apply auth middleware
  ...createServiceValidator, // Spread validation middlewares
  handleValidationErrors, // Corrected: Use handleValidationErrors
  asyncHandler(createServiceHandler)
);

// PUT /:id - Update a service
router.put(
  "/:id", 
  loadExistingServiceMiddleware, // Load service first
  checkAdminOrCompanyOwnerMiddleware, // Then check ownership/admin
  ...updateServiceValidator, // Spread validation middlewares
  handleValidationErrors, // Corrected: Use handleValidationErrors
  asyncHandler(updateServiceHandler)
);

// DELETE /:id - Delete a service
router.delete(
  "/:id", 
  loadExistingServiceMiddleware, // Load service first
  checkAdminOrCompanyOwnerMiddleware, // Then check ownership/admin
  serviceIdValidator[0], // Pass the single ID validation middleware directly
  handleValidationErrors, // Corrected: Use handleValidationErrors
  asyncHandler(deleteServiceHandler)
);

export default router;

