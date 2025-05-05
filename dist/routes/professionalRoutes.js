"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express"); // Import Request, Response, NextFunction
const professionalController_1 = require("../controllers/professionalController");
const professionalValidators_1 = require("../validators/professionalValidators");
const serviceValidators_1 = require("../validators/serviceValidators"); // Importar serviceIdValidator
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const asyncHandler_1 = require("../utils/asyncHandler"); // Import asyncHandler
// TODO: Adicionar middleware de autenticação/autorização para rotas protegidas
const router = (0, express_1.Router)();
// Aplicar asyncHandler a todas as rotas que usam funções async do controller
router.get("/", (0, asyncHandler_1.asyncHandler)(professionalController_1.getAllProfessionals));
// Usar spread operator para desestruturar arrays de validadores na chamada da rota
router.get("/:id", ...professionalValidators_1.professionalIdValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)(professionalController_1.getProfessionalById));
router.post("/", ...professionalValidators_1.createProfessionalValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)(professionalController_1.createProfessional));
router.put("/:id", ...professionalValidators_1.updateProfessionalValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)(professionalController_1.updateProfessional));
router.delete("/:id", ...professionalValidators_1.professionalIdValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)(professionalController_1.deleteProfessional));
router.post("/:professionalId/services", ...professionalValidators_1.professionalServiceAssociationValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)(professionalController_1.addServiceToProfessional));
router.delete("/:professionalId/services/:serviceId", 
// Usar spread operator para desestruturar arrays de validadores na chamada da rota
...professionalValidators_1.professionalIdValidator, ...serviceValidators_1.serviceIdValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)(professionalController_1.removeServiceFromProfessional));
exports.default = router;
