"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const professionalController_1 = require("../controllers/professionalController");
const professionalValidators_1 = require("../validators/professionalValidators");
const serviceValidators_1 = require("../validators/serviceValidators");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler")); // Corrected import
const router = (0, express_1.Router)();
// GET / - Get all professionals
router.get("/", (0, asyncHandler_1.default)(professionalController_1.getAllProfessionalsHandler));
// GET /:id - Get professional by ID
router.get("/:id", professionalValidators_1.professionalIdValidator[0], // Pass the single middleware function directly
validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)(professionalController_1.getProfessionalByIdHandler));
// POST / - Create a new professional
router.post("/", professionalController_1.checkAdminOrCompanyOwnerMiddleware, // Apply auth middleware
...professionalValidators_1.createProfessionalValidator, // Spread validation middlewares
validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)(professionalController_1.createProfessionalHandler));
// PUT /:id - Update a professional
router.put("/:id", professionalController_1.checkAdminOrCompanyOwnerMiddleware, // Apply auth middleware
...professionalValidators_1.updateProfessionalValidator, // Spread validation middlewares
validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)(professionalController_1.updateProfessionalHandler));
// DELETE /:id - Delete a professional
router.delete("/:id", professionalController_1.checkAdminOrCompanyOwnerMiddleware, // Apply auth middleware
professionalValidators_1.professionalIdValidator[0], // Pass the single middleware function directly
validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)(professionalController_1.deleteProfessionalHandler));
// POST /:professionalId/services - Associate a service with a professional
router.post("/:professionalId/services", professionalController_1.checkAdminOrCompanyOwnerMiddleware, // Apply auth middleware (checks based on professionalId)
...professionalValidators_1.professionalServiceAssociationValidator, // Spread validation middlewares
validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)(professionalController_1.addServiceToProfessionalHandler));
// DELETE /:professionalId/services/:serviceId - Disassociate a service from a professional
router.delete("/:professionalId/services/:serviceId", professionalController_1.checkAdminOrCompanyOwnerMiddleware, // Apply auth middleware (checks based on professionalId)
professionalValidators_1.professionalIdValidator[0], // Pass the single middleware function directly
serviceValidators_1.serviceIdValidator[0], // Pass the single middleware function directly
validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)(professionalController_1.removeServiceFromProfessionalHandler));
exports.default = router;
