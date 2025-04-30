import { Router } from "express";
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  deleteAppointment
} from "../controllers/appointmentController";
import { 
  createAppointmentValidator, 
  updateAppointmentValidator, 
  appointmentIdValidator 
} from "../validators/appointmentValidators";
import { validateRequest } from "../middlewares/validationMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware"; // Importar o middleware de autenticação

const router = Router();

// Aplicar middleware de autenticação a todas as rotas de agendamento
router.use(authMiddleware);

// Obter todos os agendamentos (filtrados por usuário ou profissional via query)
// O middleware já garante que req.user.id está disponível
router.get("/", getAllAppointments);

// Obter agendamento por ID
router.get("/:id", appointmentIdValidator, validateRequest, getAppointmentById);

// Criar novo agendamento
// O userId será pego de req.user.id no controller, não mais do body
router.post("/", createAppointmentValidator, validateRequest, createAppointment);

// Atualizar status do agendamento (CONFIRMED, COMPLETED, etc.)
router.patch("/:id/status", updateAppointmentValidator, validateRequest, updateAppointmentStatus);

// Rota específica para cancelar agendamento (atualiza o status para CANCELLED)
router.patch("/:id/cancel", appointmentIdValidator, validateRequest, cancelAppointment);

// Deletar agendamento (se permitido)
// router.delete("/:id", appointmentIdValidator, validateRequest, deleteAppointment);

export default router;

