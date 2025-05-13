import { body, param, query } from "express-validator"; // Adicionado 'query'

export const createAppointmentValidator = [
  body("serviceId").isUUID().withMessage("ID do serviço inválido."),
  body("professionalId").optional({ nullable: true }).isUUID().withMessage("ID do profissional inválido."),
  body("companyId").optional({ nullable: true }).isUUID().withMessage("ID da empresa inválido."),
  body("date")
    .notEmpty().withMessage("Campo 'date' é obrigatório.")
    .isISO8601().withMessage("Formato de data inválido (ISO8601 esperado)."),
  body("time").optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage("Formato de hora inválido (HH:MM)."),
  body("notes").optional({ nullable: true }).trim(),
];

export const updateAppointmentValidator = [
  param("id").isUUID().withMessage("ID do agendamento inválido."),
  body("startTime") // Mudado de 'date' para 'startTime'
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
    .isIn(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"])
    .withMessage("Status inválido. Valores permitidos: PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW."),
  body("professionalId").optional({ nullable: true }).isUUID().withMessage("ID do profissional inválido."),
  body("notes").optional({ nullable: true }).trim(),
];

export const appointmentIdValidator = [
  param("id").isUUID().withMessage("ID do agendamento inválido."),
];

// Novo validador para a rota de disponibilidade
export const getAvailabilityValidator = [
  query("date")
    .notEmpty().withMessage("O parâmetro 'date' é obrigatório.")
    .isDate({ format: "YYYY-MM-DD" }).withMessage("Formato de data inválido. Use YYYY-MM-DD."),
  query("serviceId").optional().isUUID().withMessage("ID do serviço inválido."),
  query("professionalId").optional().isUUID().withMessage("ID do profissional inválido."),
  query("companyId").optional().isUUID().withMessage("ID da empresa inválido."),
  // Adicionar validação para garantir que pelo menos um ID (serviço, profissional ou empresa) seja fornecido?
  // Depende da lógica de negócio. Por enquanto, permite buscar disponibilidade geral por data.
];

