import { Router } from "express";
import * as companyAddressController from "../controllers/companyAddressController";
import { companyAddressValidationRules, companyAddressIdValidationRules } from "../validators/companyAddressValidators";
import { authMiddleware } from "../middlewares/authMiddleware"; // Corrected: Use authMiddleware
import { validateRequest } from "../middlewares/validationMiddleware"; // Added import for validateRequest

const router = Router();

// Route to get company address (Public or authenticated? Assuming public for now)
router.get(
  "/:companyId",
  companyAddressIdValidationRules,
  validateRequest, // Use imported validateRequest
  companyAddressController.getCompanyAddress
);

// Route to create or update company address (Requires authentication and likely specific permissions)
router.put(
  "/:companyId",
  authMiddleware, // Use imported authMiddleware
  // Add specific permission middleware here if needed (e.g., check if user owns the company)
  companyAddressValidationRules,
  validateRequest, // Use imported validateRequest
  companyAddressController.upsertCompanyAddress
);

// Optional: Route to delete company address (if needed)
// router.delete(
//   "/:companyId",
//   authMiddleware, // Use imported authMiddleware
//   // Add specific permission middleware here
//   companyAddressIdValidationRules,
//   validateRequest, // Use imported validateRequest
//   companyAddressController.deleteCompanyAddress
// );

export default router;

