"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.professionalServiceAssociationValidator = exports.professionalIdValidator = exports.updateProfessionalValidator = exports.createProfessionalValidator = void 0;
const express_validator_1 = require("express-validator");
exports.createProfessionalValidator = [
    // Name and Role are now optional in the validator; the controller should handle defaults
    (0, express_validator_1.body)("name").optional().trim().notEmpty().withMessage("O nome do profissional não pode ser vazio, se fornecido."),
    (0, express_validator_1.body)("role").optional().trim().notEmpty().withMessage("O cargo do profissional não pode ser vazio, se fornecido."),
    // CompanyId is now optional
    (0, express_validator_1.body)("companyId").optional().isUUID().withMessage("ID da empresa inválido, se fornecido."),
    (0, express_validator_1.body)("image").optional().trim().isURL().withMessage("URL da imagem inválida."),
    // Add validation for other fields from UserProfessionalInfo if needed (e.g., bio, phone)
    (0, express_validator_1.body)("bio").optional().trim(),
    (0, express_validator_1.body)("phone").optional().trim(), // Add more specific phone validation if required
    // Consider validating experience and education arrays if they are part of the creation payload
];
exports.updateProfessionalValidator = [
    (0, express_validator_1.param)("id").isUUID().withMessage("ID do profissional inválido."),
    (0, express_validator_1.body)("name").optional().trim().notEmpty().withMessage("O nome do profissional não pode ser vazio."),
    (0, express_validator_1.body)("role").optional().trim().notEmpty().withMessage("O cargo do profissional não pode ser vazio."),
    (0, express_validator_1.body)("image").optional({ nullable: true }).trim().isURL().withMessage("URL da imagem inválida."),
    (0, express_validator_1.body)("bio").optional({ nullable: true }).trim(),
    (0, express_validator_1.body)("phone").optional({ nullable: true }).trim(),
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
