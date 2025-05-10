"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const serviceController_1 = require("../controllers/serviceController");
const serviceValidators_1 = require("../validators/serviceValidators");
const validationMiddleware_1 = require("../middlewares/validationMiddleware"); // Corrected import
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler")); // Corrected import
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// GET / - Get all services
router.get("/", (0, asyncHandler_1.default)(serviceController_1.getAllServicesHandler));
// GET /:id - Get service by ID
router.get("/:id", serviceValidators_1.serviceIdValidator[0], // Pass the single middleware function directly
validationMiddleware_1.validateRequest, // Corrected: Use validateRequest
(0, asyncHandler_1.default)(serviceController_1.getServiceByIdHandler));
// POST / - Create a new service
router.post("/", authMiddleware_1.authMiddleware, // Require authentication
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Permitir ADMIN, COMPANY_OWNER ou qualquer usuário com perfil profissional
    const allowedRoles = ["ADMIN", "COMPANY_OWNER"];
    if (!req.user) {
        res.status(401).json({ message: "Usuário não autenticado." });
        return;
    }
    // Se for ADMIN ou COMPANY_OWNER, pode criar
    if (allowedRoles.includes(String(req.user.role).toUpperCase())) {
        return next();
    }
    // Para qualquer usuário autenticado, verificar se possui perfil profissional
    const professionalRepository = require("../repositories/professionalRepository").professionalRepository;
    const professional = yield professionalRepository.findByUserId(req.user.id);
    if (professional) {
        req.body.professionalId = professional.id;
        return next();
    }
    res.status(403).json({ message: `Acesso negado. Apenas profissionais (com perfil criado), empresas ou administradores podem criar serviços. Seu role: ${req.user.role}` });
}), ...serviceValidators_1.createServiceValidator, // Spread validation middlewares
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
