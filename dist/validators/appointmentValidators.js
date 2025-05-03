"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailabilityValidator = exports.appointmentIdValidator = exports.updateAppointmentValidator = exports.createAppointmentValidator = void 0;
const express_validator_1 = require("express-validator"); // Adicionado 'query'
exports.createAppointmentValidator = [
    // Mantém a validação de criação existente...
    (0, express_validator_1.body)("startTime") // Mudado de 'date' para 'startTime'
        .isISO8601().withMessage("Formato de data inválido (ISO8601 esperado).")
        .toDate() // Converte para objeto Date para validações futuras se necessário
        .custom((value) => {
        if (value < new Date()) {
            throw new Error("A data do agendamento não pode ser no passado.");
        }
        return true;
    }),
    // userId geralmente virá do token JWT, não do body
    (0, express_validator_1.body)("userId").isUUID().withMessage("ID do usuário inválido."), // Adicionado validação para userId (pode ser preenchido pelo controller)
    (0, express_validator_1.body)("serviceId").isUUID().withMessage("ID do serviço inválido."),
    (0, express_validator_1.body)("professionalId").optional({ nullable: true }).isUUID().withMessage("ID do profissional inválido."),
    (0, express_validator_1.body)("companyId").optional({ nullable: true }).isUUID().withMessage("ID da empresa inválido."), // Adicionado companyId
    (0, express_validator_1.body)("notes").optional({ nullable: true }).trim(),
];
exports.updateAppointmentValidator = [
    (0, express_validator_1.param)("id").isUUID().withMessage("ID do agendamento inválido."),
    (0, express_validator_1.body)("startTime") // Mudado de 'date' para 'startTime'
        .optional()
        .isISO8601().withMessage("Formato de data inválido (ISO8601 esperado).")
        .toDate()
        .custom((value) => {
        if (value < new Date()) {
            throw new Error("A data do agendamento não pode ser no passado.");
        }
        return true;
    }),
    (0, express_validator_1.body)("status")
        .optional()
        .isIn(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"])
        .withMessage("Status inválido. Valores permitidos: PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW."),
    (0, express_validator_1.body)("professionalId").optional({ nullable: true }).isUUID().withMessage("ID do profissional inválido."),
    (0, express_validator_1.body)("notes").optional({ nullable: true }).trim(),
];
exports.appointmentIdValidator = [
    (0, express_validator_1.param)("id").isUUID().withMessage("ID do agendamento inválido."),
];
// Novo validador para a rota de disponibilidade
exports.getAvailabilityValidator = [
    (0, express_validator_1.query)("date")
        .notEmpty().withMessage("O parâmetro 'date' é obrigatório.")
        .isDate({ format: "YYYY-MM-DD" }).withMessage("Formato de data inválido. Use YYYY-MM-DD."),
    (0, express_validator_1.query)("serviceId").optional().isUUID().withMessage("ID do serviço inválido."),
    (0, express_validator_1.query)("professionalId").optional().isUUID().withMessage("ID do profissional inválido."),
    (0, express_validator_1.query)("companyId").optional().isUUID().withMessage("ID da empresa inválido."),
    // Adicionar validação para garantir que pelo menos um ID (serviço, profissional ou empresa) seja fornecido?
    // Depende da lógica de negócio. Por enquanto, permite buscar disponibilidade geral por data.
];
