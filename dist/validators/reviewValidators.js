"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewIdValidator = exports.updateReviewValidator = exports.createReviewValidator = void 0;
const express_validator_1 = require("express-validator");
exports.createReviewValidator = [
    (0, express_validator_1.body)("rating")
        .isFloat({ min: 1, max: 5 }).withMessage("A avaliação deve ser um número entre 1 e 5."),
    (0, express_validator_1.body)("comment").optional().trim(),
    // userId virá do token JWT
    // Pelo menos um ID de referência deve ser fornecido
    (0, express_validator_1.body)().custom((value, { req }) => {
        if (!req.body.serviceId && !req.body.professionalId && !req.body.companyId) {
            throw new Error("Pelo menos um ID (serviço, profissional ou empresa) deve ser fornecido para a avaliação.");
        }
        return true;
    }),
    (0, express_validator_1.body)("serviceId").optional().isUUID().withMessage("ID do serviço inválido."),
    (0, express_validator_1.body)("professionalId").optional().isUUID().withMessage("ID do profissional inválido."),
    (0, express_validator_1.body)("companyId").optional().isUUID().withMessage("ID da empresa inválido."),
];
exports.updateReviewValidator = [
    (0, express_validator_1.param)("id").isUUID().withMessage("ID da avaliação inválido."),
    (0, express_validator_1.body)("rating")
        .optional()
        .isFloat({ min: 1, max: 5 }).withMessage("A avaliação deve ser um número entre 1 e 5."),
    (0, express_validator_1.body)("comment").optional({ nullable: true }).trim(),
    // Não permitir alterar a entidade avaliada (serviceId, professionalId, companyId)
];
exports.reviewIdValidator = [
    (0, express_validator_1.param)("id").isUUID().withMessage("ID da avaliação inválido."),
];
