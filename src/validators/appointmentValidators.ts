import { body, param } from "express-validator";

export const createAppointmentValidator = [
  body("date")
    .isISO8601().withMessage("Formato de data inválido (ISO8601 esperado).")
    .toDate() // Converte para objeto Date para validações futuras se necessário
    .custom((value) => {
      if (value < new Date()) {
        throw new Error("A data do agendamento não pode ser no passado.");
      }
      return true;
    }),
  // userId geralmente virá do token JWT, não do body
  // body("userId").isUUID().withMessage("ID do usuário inválido."),
  body("serviceId").isUUID().withMessage("ID do serviço inválido."),
  body("professionalId").optional().isUUID().withMessage("ID do profissional inválido."),
  body("notes").optional().trim(),
];

export const updateAppointmentValidator = [
  param("id").isUUID().withMessage("ID do agendamento inválido."),
  body("date")
    .optional()
    .isISO8601().withMessage("Formato de data inválido (ISO8601 esperado).")
    .toDate()
    .custom((value) => {
      if (value < new Date()) {
        throw new Error("A data do agendamento não pode ser no passado.");
      }
      return true;
    }),
  body("status")
    .optional()
    .isIn(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"])
    .withMessage("Status inválido. Valores permitidos: PENDING, CONFIRMED, COMPLETED, CANCELLED."),
  body("professionalId").optional({ nullable: true }).isUUID().withMessage("ID do profissional inválido."),
  body("notes").optional({ nullable: true }).trim(),
];

export const appointmentIdValidator = [
  param("id").isUUID().withMessage("ID do agendamento inválido."),
];

