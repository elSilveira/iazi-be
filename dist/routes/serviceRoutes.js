"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const serviceController_1 = require("../controllers/serviceController");
const serviceValidators_1 = require("../validators/serviceValidators");
const validationMiddleware_1 = require("../middlewares/validationMiddleware"); // Corrected import
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler")); // Corrected import
const router = (0, express_1.Router)();
// GET / - Get all services
router.get("/", (0, asyncHandler_1.default)(serviceController_1.getAllServicesHandler));
// GET /:id - Get service by ID
router.get("/:id", serviceValidators_1.serviceIdValidator[0], // Pass the single middleware function directly
validationMiddleware_1.validateRequest, // Corrected: Use validateRequest
(0, asyncHandler_1.default)(serviceController_1.getServiceByIdHandler));
// POST / - Create a new service
router.post("/", serviceController_1.checkAdminRoleMiddleware, // Apply auth middleware
...serviceValidators_1.createServiceValidator, // Spread validation middlewares
validationMiddleware_1.validateRequest, // Corrected: Use validateRequest
(0, asyncHandler_1.default)(serviceController_1.createServiceHandler));
// PUT /:id - Update a service
router.put("/:id", serviceController_1.loadExistingServiceMiddleware, // Load service first
serviceController_1.checkAdminOrCompanyOwnerMiddleware, // Then check ownership/admin
...serviceValidators_1.updateServiceValidator, // Spread validation middlewares
validationMiddleware_1.validateRequest, // Corrected: Use validateRequest
(0, asyncHandler_1.default)(serviceController_1.updateServiceHandler));
// DELETE /:id - Delete a service
router.delete("/:id", serviceController_1.loadExistingServiceMiddleware, // Load service first
serviceController_1.checkAdminOrCompanyOwnerMiddleware, // Then check ownership/admin
serviceValidators_1.serviceIdValidator[0], // Pass the single ID validation middleware directly
validationMiddleware_1.validateRequest, // Corrected: Use validateRequest
(0, asyncHandler_1.default)(serviceController_1.deleteServiceHandler));
exports.default = router;
