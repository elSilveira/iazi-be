"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appointmentIdValidator = exports.updateAppointmentValidator = exports.createAppointmentValidator = void 0;
const express_validator_1 = require("express-validator");
exports.createAppointmentValidator = [
    (0, express_validator_1.body)("date")
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
    (0, express_validator_1.body)("serviceId").isUUID().withMessage("ID do serviço inválido."),
    (0, express_validator_1.body)("professionalId").optional().isUUID().withMessage("ID do profissional inválido."),
    (0, express_validator_1.body)("notes").optional().trim(),
];
exports.updateAppointmentValidator = [
    (0, express_validator_1.param)("id").isUUID().withMessage("ID do agendamento inválido."),
    (0, express_validator_1.body)("date")
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
        .isIn(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"])
        .withMessage("Status inválido. Valores permitidos: PENDING, CONFIRMED, COMPLETED, CANCELLED."),
    (0, express_validator_1.body)("professionalId").optional({ nullable: true }).isUUID().withMessage("ID do profissional inválido."),
    (0, express_validator_1.body)("notes").optional({ nullable: true }).trim(),
];
exports.appointmentIdValidator = [
    (0, express_validator_1.param)("id").isUUID().withMessage("ID do agendamento inválido."),
];
