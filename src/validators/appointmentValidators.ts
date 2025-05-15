import { body, param, query } from "express-validator"; // Adicionado 'query'

export const createAppointmentValidator = [
  // First try to validate serviceIds as an array (new format)
  body("serviceIds")
    .optional()
    .custom((value, { req }) => {
      // If serviceIds exists, it must be an array with valid UUIDs
      if (value !== undefined) {
        if (!Array.isArray(value)) {
          throw new Error("serviceIds deve ser um array.");
        }
        if (value.length === 0) {
          throw new Error("Pelo menos um serviço deve ser selecionado.");
        }
        if (!value.every((id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))) {
          throw new Error("Um ou mais IDs de serviços são inválidos.");
        }
      }
      // If serviceIds doesn't exist, check if serviceId exists (backward compatibility)
      else if (!req.body.serviceId) {
        throw new Error("Serviço é obrigatório. Forneça serviceIds ou serviceId.");
      }
      return true;
    }),
  
  // Legacy support for single serviceId (optional if serviceIds exists)
  body("serviceId")
    .optional()
    .isUUID().withMessage("ID do serviço inválido.")
    .custom((value, { req }) => {
      // If using old format (serviceId), convert it to the new format (serviceIds)
      if (value && !req.body.serviceIds) {
        req.body.serviceIds = [value];
      }
      return true;
    }),
  body("professionalId").optional({ nullable: true }).isUUID().withMessage("ID do profissional inválido."),
  body("companyId").optional({ nullable: true }).isUUID().withMessage("ID da empresa inválido."),
  body("date")
    .notEmpty().withMessage("Campo 'date' é obrigatório.")
    .isISO8601().withMessage("Formato de data inválido (ISO8601 esperado)."),
  body("time")
    .notEmpty().withMessage("Campo 'time' é obrigatório.")
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

