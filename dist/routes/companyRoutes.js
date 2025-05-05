"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express"); // Import Request, Response, NextFunction
const companyController_1 = require("../controllers/companyController");
const companyValidators_1 = require("../validators/companyValidators");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const asyncHandler_1 = require("../utils/asyncHandler"); // Import asyncHandler
const dummyMiddleware_1 = require("../middlewares/dummyMiddleware"); // Import dummy middleware
// TODO: Adicionar middleware de autenticação/autorização para rotas protegidas
const router = (0, express_1.Router)();
// Aplicar asyncHandler a todas as rotas que usam funções async do controller
router.get("/", (0, asyncHandler_1.asyncHandler)(companyController_1.getAllCompanies));
// Usar spread operator para desestruturar arrays de validadores na chamada da rota
router.get("/:id", ...companyValidators_1.companyIdValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)(companyController_1.getCompanyById));
// Test: Replace validator with dummy middleware
router.post("/", dummyMiddleware_1.dummyMiddleware, validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)(companyController_1.createCompany)); // Using dummyMiddleware + validateRequest
router.put("/:id", ...companyValidators_1.updateCompanyValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)(companyController_1.updateCompany));
router.delete("/:id", ...companyValidators_1.companyIdValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)(companyController_1.deleteCompany));
exports.default = router;
