import { Router } from "express";
import {
  getAllAppointments, // Assumindo que existe no controller
  getAppointmentById, // Assumindo que existe no controller
  createAppointment, // Assumindo que existe no controller
  updateAppointment, // Assumindo que existe no controller
  // deleteAppointment // Geralmente não se deleta, mas cancela (update status)
} from "../controllers/appointmentController";
import { 
  createAppointmentValidator, 
  updateAppointmentValidator, 
  appointmentIdValidator 
} from "../validators/appointmentValidators";
import { validateRequest } from "../middlewares/validationMiddleware";
// TODO: Adicionar middleware de autenticação (obrigatório para todas as rotas de agendamento)

const router = Router();

// Obter todos os agendamentos (provavelmente filtrados por usuário ou empresa/profissional)
// TODO: Adicionar filtros e validação para query params (userId, companyId, professionalId, dateRange, etc.)
router.get("/", getAllAppointments);

// Obter agendamento por ID
router.get("/:id", appointmentIdValidator, validateRequest, getAppointmentById);

// Criar novo agendamento
// O userId deve ser obtido do token JWT (middleware de autenticação)
router.post("/", createAppointmentValidator, validateRequest, createAppointment);

// Atualizar agendamento (ex: status, data, notas)
router.put("/:id", updateAppointmentValidator, validateRequest, updateAppointment);

// Rota para cancelar agendamento (atualiza o status para CANCELLED)
// Poderia ser um PATCH ou PUT específico
// router.patch("/:id/cancel", appointmentIdValidator, validateRequest, cancelAppointment);

export default router;

