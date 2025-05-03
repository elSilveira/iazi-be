import { body, param } from "express-validator";

// Validation rules for creating/updating CompanyAddress
export const companyAddressValidationRules = [
  body("street").notEmpty().withMessage("Street is required").isString(),
  body("number").notEmpty().withMessage("Number is required").isString(),
  body("complement").optional().isString(),
  body("neighborhood").notEmpty().withMessage("Neighborhood is required").isString(),
  body("city").notEmpty().withMessage("City is required").isString(),
  body("state").notEmpty().withMessage("State is required").isString().isLength({ min: 2, max: 2 }).withMessage("State must be 2 characters"),
  body("zipCode").notEmpty().withMessage("Zip code is required").isString().isPostalCode("BR").withMessage("Invalid Brazilian zip code"),
  param("companyId").isUUID().withMessage("Invalid Company ID format"),
];

// Validation rules for getting/deleting CompanyAddress (just needs companyId param validation)
export const companyAddressIdValidationRules = [
  param("companyId").isUUID().withMessage("Invalid Company ID format"),
];

