"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyAddressIdValidationRules = exports.companyAddressValidationRules = void 0;
const express_validator_1 = require("express-validator");
// Validation rules for creating/updating CompanyAddress
exports.companyAddressValidationRules = [
    (0, express_validator_1.body)("street").notEmpty().withMessage("Street is required").isString(),
    (0, express_validator_1.body)("number").notEmpty().withMessage("Number is required").isString(),
    (0, express_validator_1.body)("complement").optional().isString(),
    (0, express_validator_1.body)("neighborhood").notEmpty().withMessage("Neighborhood is required").isString(),
    (0, express_validator_1.body)("city").notEmpty().withMessage("City is required").isString(),
    (0, express_validator_1.body)("state").notEmpty().withMessage("State is required").isString().isLength({ min: 2, max: 2 }).withMessage("State must be 2 characters"),
    (0, express_validator_1.body)("zipCode").notEmpty().withMessage("Zip code is required").isString().isPostalCode("BR").withMessage("Invalid Brazilian zip code"),
    (0, express_validator_1.param)("companyId").isUUID().withMessage("Invalid Company ID format"),
];
// Validation rules for getting/deleting CompanyAddress (just needs companyId param validation)
exports.companyAddressIdValidationRules = [
    (0, express_validator_1.param)("companyId").isUUID().withMessage("Invalid Company ID format"),
];
