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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express"); // Import Request, Response, NextFunction
const appointmentController_1 = require("../controllers/appointmentController");
const appointmentValidators_1 = require("../validators/appointmentValidators");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const authMiddleware_1 = require("../middlewares/authMiddleware"); // Importar o middleware de autenticação
const asyncHandler_1 = require("../utils/asyncHandler"); // Importar asyncHandler
const router = (0, express_1.Router)();
// --- Rota Pública (ou com autenticação opcional?) para Disponibilidade ---
// router.get("/availability", getAvailabilityValidator, validateRequest, asyncHandler(getAppointmentAvailability)); // Comentado pois a função não está exportada
// --- Rotas Protegidas --- 
router.use((0, asyncHandler_1.asyncHandler)(authMiddleware_1.authMiddleware)); // Aplicar asyncHandler ao middleware async
router.get("/", (0, asyncHandler_1.asyncHandler)(appointmentController_1.listAppointments)); // Usar asyncHandler
router.get("/:id", appointmentValidators_1.appointmentIdValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)(appointmentController_1.getAppointmentById)); // Usar asyncHandler
router.post("/", appointmentValidators_1.createAppointmentValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)(appointmentController_1.createAppointment)); // Usar asyncHandler
router.patch("/:id/status", appointmentValidators_1.updateAppointmentValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)(appointmentController_1.updateAppointmentStatus)); // Usar asyncHandler
// Rota para cancelamento (usando updateStatus)
router.patch("/:id/cancel", appointmentValidators_1.appointmentIdValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Wrapper para chamar updateAppointmentStatus com status CANCELLED
    req.body.status = 'CANCELLED'; // Forçar o status
    // TODO: Adicionar validação específica para cancelamento se necessário
    // (ex: verificar permissões, prazo mínimo)
    // Chamar diretamente a função do controller, já que está envolvida por asyncHandler
    yield (0, appointmentController_1.updateAppointmentStatus)(req, res, next);
})));
// router.delete("/:id", appointmentIdValidator, validateRequest, asyncHandler(deleteAppointment)); // Comentado pois a função não está exportada
exports.default = router;
