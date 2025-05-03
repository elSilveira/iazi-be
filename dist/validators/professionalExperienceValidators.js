"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.professionalIdValidationRules = exports.professionalExperienceIdValidationRules = exports.professionalExperienceValidationRules = void 0;
const express_validator_1 = require("express-validator");
// Validation rules for creating/updating ProfessionalExperience
exports.professionalExperienceValidationRules = [
    (0, express_validator_1.param)("professionalId").isUUID().withMessage("Invalid Professional ID format"),
    (0, express_validator_1.body)("title").notEmpty().withMessage("Title is required").isString(),
    (0, express_validator_1.body)("companyName").notEmpty().withMessage("Company name is required").isString(),
    (0, express_validator_1.body)("description").optional().isString(),
    (0, express_validator_1.body)("startDate").isISO8601().toDate().withMessage("Invalid start date format (YYYY-MM-DD)"),
    (0, express_validator_1.body)("endDate").optional({ nullable: true }).isISO8601().toDate().withMessage("Invalid end date format (YYYY-MM-DD)"),
    (0, express_validator_1.body)("isCurrent").optional().isBoolean().withMessage("isCurrent must be a boolean"),
    // Ensure endDate is not present if isCurrent is true
    (0, express_validator_1.body)().custom((value, { req }) => {
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
exports.professionalExperienceIdValidationRules = [
    (0, express_validator_1.param)("professionalId").isUUID().withMessage("Invalid Professional ID format"),
    (0, express_validator_1.param)("experienceId").isUUID().withMessage("Invalid Experience ID format"),
];
// Validation rules for listing ProfessionalExperience (just needs professionalId)
exports.professionalIdValidationRules = [
    (0, express_validator_1.param)("professionalId").isUUID().withMessage("Invalid Professional ID format"),
];
