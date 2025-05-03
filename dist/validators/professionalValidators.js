"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.professionalServiceAssociationValidator = exports.professionalIdValidator = exports.updateProfessionalValidator = exports.createProfessionalValidator = void 0;
const express_validator_1 = require("express-validator");
exports.createProfessionalValidator = [
    (0, express_validator_1.body)("name").trim().notEmpty().withMessage("O nome do profissional é obrigatório."),
    (0, express_validator_1.body)("role").trim().notEmpty().withMessage("O cargo do profissional é obrigatório."),
    (0, express_validator_1.body)("companyId").isUUID().withMessage("ID da empresa inválido."),
    (0, express_validator_1.body)("image").optional().trim().isURL().withMessage("URL da imagem inválida."),
    // rating e appointments são geralmente calculados, não definidos na criação
];
exports.updateProfessionalValidator = [
    (0, express_validator_1.param)("id").isUUID().withMessage("ID do profissional inválido."),
    (0, express_validator_1.body)("name").optional().trim().notEmpty().withMessage("O nome do profissional não pode ser vazio."),
    (0, express_validator_1.body)("role").optional().trim().notEmpty().withMessage("O cargo do profissional não pode ser vazio."),
    (0, express_validator_1.body)("image").optional({ nullable: true }).trim().isURL().withMessage("URL da imagem inválida."),
    // companyId geralmente não é atualizado
];
exports.professionalIdValidator = [
    (0, express_validator_1.param)("id").isUUID().withMessage("ID do profissional inválido."),
];
// Validador para associar/desassociar serviços a um profissional
exports.professionalServiceAssociationValidator = [
    (0, express_validator_1.param)("professionalId").isUUID().withMessage("ID do profissional inválido."),
    (0, express_validator_1.body)("serviceId").isUUID().withMessage("ID do serviço inválido."),
    (0, express_validator_1.body)("price").optional().trim().notEmpty().withMessage("O preço específico não pode ser vazio."), // Validar formato se necessário
];
