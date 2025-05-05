import { Router } from "express";
import {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  checkAdminRoleMiddleware // Import middleware
} from "../controllers/companyController";
import { 
  createCompanyValidator, 
  updateCompanyValidator, 
  companyIdValidator 
} from "../validators/companyValidators";
import { validateRequest } from "../middlewares/validationMiddleware";
import asyncHandler from "../utils/asyncHandler"; // Corrected import

const router = Router();

// GET / - Get all companies
router.get("/", asyncHandler(getAllCompanies));

// GET /:id - Get company by ID
router.get(
  "/:id", 
  companyIdValidator[0], // Pass the single middleware function directly
  validateRequest, 
  asyncHandler(getCompanyById)
);

// POST / - Create a new company
router.post(
  "/", 
  checkAdminRoleMiddleware, // Apply auth middleware
  ...createCompanyValidator, // Spread validation middlewares
  validateRequest, 
  asyncHandler(createCompany)
);

// PUT /:id - Update a company
router.put(
  "/:id", 
  checkAdminRoleMiddleware, // Apply auth middleware
  ...updateCompanyValidator, // Spread validation middlewares
  validateRequest, 
  asyncHandler(updateCompany)
);

// DELETE /:id - Delete a company
router.delete(
  "/:id", 
  checkAdminRoleMiddleware, // Apply auth middleware
  companyIdValidator[0], // Pass the single middleware function directly
  validateRequest, 
  asyncHandler(deleteCompany)
);

export default router;

