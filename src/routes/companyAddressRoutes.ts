import { Router } from "express";
import * as companyAddressController from "../controllers/companyAddressController";
import { companyAddressValidationRules, companyAddressIdValidationRules } from "../validators/companyAddressValidators";
import { authMiddleware } from "../middlewares/authMiddleware"; // Corrected import name
import { validateRequest } from "../middlewares/validationMiddleware"; // Corrected import path

const router = Router();

// Route to get company address (Public or authenticated? Assuming public for now)
router.get(
  "/:companyId",
  companyAddressIdValidationRules,
  validateRequest,
  companyAddressController.getCompanyAddress
);

// Route to create or update company address (Requires authentication and likely specific permissions)
router.put(
  "/:companyId",
  authMiddleware, // Use correct middleware name
  // Add specific permission middleware here if needed (e.g., check if user owns the company)
  companyAddressValidationRules,
  validateRequest,
  companyAddressController.upsertCompanyAddress
);

// Optional: Route to delete company address (if needed)
// router.delete(
//   "/:companyId",
//   authMiddleware, // Use correct middleware name
//   // Add specific permission middleware here
//   companyAddressIdValidationRules,
//   validateRequest,
//   companyAddressController.deleteCompanyAddress
// );

export default router;

