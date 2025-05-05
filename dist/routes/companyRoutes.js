"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const companyController_1 = require("../controllers/companyController");
const companyValidators_1 = require("../validators/companyValidators");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler")); // Corrected import
const router = (0, express_1.Router)();
// GET / - Get all companies
router.get("/", (0, asyncHandler_1.default)(companyController_1.getAllCompaniesHandler));
// GET /:id - Get company by ID
router.get("/:id", companyValidators_1.companyIdValidator[0], // Pass the single middleware function directly
validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)(companyController_1.getCompanyByIdHandler));
// POST / - Create a new company
router.post("/", companyController_1.checkAdminRoleMiddleware, // Apply auth middleware
...companyValidators_1.createCompanyValidator, // Spread validation middlewares
validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)(companyController_1.createCompanyHandler));
// PUT /:id - Update a company
router.put("/:id", companyController_1.checkAdminRoleMiddleware, // Apply auth middleware
...companyValidators_1.updateCompanyValidator, // Spread validation middlewares
validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)(companyController_1.updateCompanyHandler));
// DELETE /:id - Delete a company
router.delete("/:id", companyController_1.checkAdminRoleMiddleware, // Apply auth middleware
companyValidators_1.companyIdValidator[0], // Pass the single middleware function directly
validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)(companyController_1.deleteCompanyHandler));
exports.default = router;
