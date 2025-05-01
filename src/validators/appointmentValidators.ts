import { body, param, query } from "express-validator"; // Adicionado 'query'

export const createAppointmentValidator = [
  // Mantém a validação de criação existente...
  body("startTime") // Mudado de 'date' para 'startTime'
    .isISO8601().withMessage("Formato de data inválido (ISO8601 esperado).")
    .toDate() // Converte para objeto Date para validações futuras se necessário
    .custom((value) => {
      if (value < new Date()) {
        throw new Error("A data do agendamento não pode ser no passado.");
      }
      return true;
    }),
  // userId geralmente virá do token JWT, não do body
  body("userId").isUUID().withMessage("ID do usuário inválido."), // Adicionado validação para userId (pode ser preenchido pelo controller)
  body("serviceId").isUUID().withMessage("ID do serviço inválido."),
  body("professionalId").optional({ nullable: true }).isUUID().withMessage("ID do profissional inválido."),
  body("companyId").optional({ nullable: true }).isUUID().withMessage("ID da empresa inválido."), // Adicionado companyId
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

