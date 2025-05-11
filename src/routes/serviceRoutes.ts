import { Router } from "express";
import {
  getAllServicesHandler,
  getServiceByIdHandler,
  createServiceHandler,
  updateServiceHandler,
  deleteServiceHandler,
  checkAdminOrCompanyOwnerMiddleware,
  loadExistingServiceMiddleware
} from "../controllers/serviceController";
import { 
  createServiceValidator, 
  updateServiceValidator, 
  serviceIdValidator 
} from "../validators/serviceValidators";
import { validateRequest } from "../middlewares/validationMiddleware"; // Corrected import
import asyncHandler from "../utils/asyncHandler"; // Corrected import
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// GET / - Get all services
router.get("/", asyncHandler(getAllServicesHandler));

// GET /:id - Get service by ID
router.get(
  "/:id", 
  serviceIdValidator[0], // Pass the single middleware function directly
  validateRequest, // Corrected: Use validateRequest
  asyncHandler(getServiceByIdHandler)
);

// POST / - Create a new service
router.post(
  "/", 
  authMiddleware, // Require authentication
  async (req, res, next) => {
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
    const professional = await professionalRepository.findByUserId(req.user.id);
    if (professional) {
      req.body.professionalId = professional.id;
      return next();
    }
    res.status(403).json({ message: `Acesso negado. Apenas profissionais (com perfil criado), empresas ou administradores podem criar serviços. Seu role: ${req.user.role}` });
  },
  ...createServiceValidator, // Spread validation middlewares
  validateRequest, // Corrected: Use validateRequest
  asyncHandler(createServiceHandler)
);

// PUT /:id - Update a service
router.put(
  "/:id", 
  loadExistingServiceMiddleware, // Load service first
  checkAdminOrCompanyOwnerMiddleware, // Then check ownership/admin
  ...updateServiceValidator, // Spread validation middlewares
  validateRequest, // Corrected: Use validateRequest
  asyncHandler(updateServiceHandler)
);

// DELETE /:id - Delete a service
router.delete(
  "/:id", 
  loadExistingServiceMiddleware, // Load service first
  checkAdminOrCompanyOwnerMiddleware, // Then check ownership/admin
  serviceIdValidator[0], // Pass the single ID validation middleware directly
  validateRequest, // Corrected: Use validateRequest
  asyncHandler(deleteServiceHandler)
);

// GET /api/professionals/service - List only services with professionals linked
router.get("/professionals/service", asyncHandler(require("../controllers/serviceController").getServicesWithProfessionals));

export default router;

