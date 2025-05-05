"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express"); // Import Request, Response, NextFunction
const serviceController_1 = require("../controllers/serviceController");
const serviceValidators_1 = require("../validators/serviceValidators");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const asyncHandler_1 = require("../utils/asyncHandler"); // Import asyncHandler
// TODO: Adicionar middleware de autenticação/autorização para rotas protegidas (create, update, delete)
const router = (0, express_1.Router)();
// Aplicar asyncHandler e usar spread operator para arrays de validadores
router.get("/", (0, asyncHandler_1.asyncHandler)(serviceController_1.getAllServices));
router.get("/:id", ...serviceValidators_1.serviceIdValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)(serviceController_1.getServiceById));
router.post("/", ...serviceValidators_1.createServiceValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)(serviceController_1.createService));
router.put("/:id", ...serviceValidators_1.updateServiceValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)(serviceController_1.updateService));
router.delete("/:id", ...serviceValidators_1.serviceIdValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)(serviceController_1.deleteService));
exports.default = router;
