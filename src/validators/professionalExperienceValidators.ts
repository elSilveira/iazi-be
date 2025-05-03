import { body, param } from "express-validator";

// Validation rules for creating/updating ProfessionalExperience
export const professionalExperienceValidationRules = [
  param("professionalId").isUUID().withMessage("Invalid Professional ID format"),
  body("title").notEmpty().withMessage("Title is required").isString(),
  body("companyName").notEmpty().withMessage("Company name is required").isString(),
  body("description").optional().isString(),
  body("startDate").isISO8601().toDate().withMessage("Invalid start date format (YYYY-MM-DD)"),
  body("endDate").optional({ nullable: true }).isISO8601().toDate().withMessage("Invalid end date format (YYYY-MM-DD)"),
  body("isCurrent").optional().isBoolean().withMessage("isCurrent must be a boolean"),
  // Ensure endDate is not present if isCurrent is true
  body().custom((value, { req }) => {
    if (req.body.isCurrent === true && req.body.endDate) {
      throw new Error("endDate must be null if isCurrent is true");
    }
    if (req.body.isCurrent !== true && !req.body.endDate) {
        // Allow endDate to be null if isCurrent is false or undefined/null
    }
    return true;
  }),
];

// Validation rules for getting/deleting ProfessionalExperience (needs professionalId and experienceId)
export const professionalExperienceIdValidationRules = [
  param("professionalId").isUUID().withMessage("Invalid Professional ID format"),
  param("experienceId").isUUID().withMessage("Invalid Experience ID format"),
];

// Validation rules for listing ProfessionalExperience (just needs professionalId)
export const professionalIdValidationRules = [
  param("professionalId").isUUID().withMessage("Invalid Professional ID format"),
];

