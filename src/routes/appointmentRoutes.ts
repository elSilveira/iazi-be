import { Router, Request, Response, NextFunction } from "express"; // Import Request, Response, NextFunction
import {
  // getAllAppointments, // Renomeado ou não exportado? Usar listAppointments
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  // cancelAppointment, // Usar updateAppointmentStatus com status CANCELLED
  // deleteAppointment, // Função de delete não implementada/exportada
  // getAppointmentAvailability // Função de disponibilidade não implementada/exportada?
  listAppointments, // Assumindo que esta é a função correta para listar
  // Adicionar outras funções exportadas do controller se necessário
} from "../controllers/appointmentController";
import { 
  createAppointmentValidator, 
  updateAppointmentValidator, 
  appointmentIdValidator,
  getAvailabilityValidator // Importar novo validator
} from "../validators/appointmentValidators";
import { validateRequest } from "../middlewares/validationMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware"; // Importar o middleware de autenticação
import asyncHandler from "../utils/asyncHandler"; // Importar asyncHandler

const router = Router();

// --- Rota Pública (ou com autenticação opcional?) para Disponibilidade ---
// router.get("/availability", getAvailabilityValidator, validateRequest, asyncHandler(getAppointmentAvailability)); // Comentado pois a função não está exportada

// --- Rotas Protegidas --- 
router.use(asyncHandler(authMiddleware)); // Aplicar asyncHandler ao middleware async

router.get("/", asyncHandler(listAppointments)); // Usar asyncHandler

router.get("/:id", appointmentIdValidator, validateRequest, asyncHandler(getAppointmentById)); // Usar asyncHandler

router.post("/", createAppointmentValidator, validateRequest, asyncHandler(createAppointment)); // Usar asyncHandler

router.patch("/:id/status", updateAppointmentValidator, validateRequest, asyncHandler(updateAppointmentStatus)); // Usar asyncHandler

// Rota para cancelamento (usando updateStatus)
router.patch("/:id/cancel", appointmentIdValidator, validateRequest, asyncHandler(async (req: Request, res: Response, next: NextFunction) => { // Tipar parâmetros e usar asyncHandler
    // Wrapper para chamar updateAppointmentStatus com status CANCELLED
    req.body.status = 'CANCELLED'; // Forçar o status
    // TODO: Adicionar validação específica para cancelamento se necessário
    // (ex: verificar permissões, prazo mínimo)
    // Chamar diretamente a função do controller, já que está envolvida por asyncHandler
    await updateAppointmentStatus(req, res, next); 
}));

// router.delete("/:id", appointmentIdValidator, validateRequest, asyncHandler(deleteAppointment)); // Comentado pois a função não está exportada

export default router;

