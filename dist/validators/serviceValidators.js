"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceIdValidator = exports.updateServiceValidator = exports.createServiceValidator = void 0;
const express_validator_1 = require("express-validator");
exports.createServiceValidator = [
    (0, express_validator_1.body)("name").trim().notEmpty().withMessage("O nome do serviço é obrigatório."),
    (0, express_validator_1.body)("description").trim().notEmpty().withMessage("A descrição do serviço é obrigatória."),
    (0, express_validator_1.body)("price").trim().notEmpty().withMessage("O preço do serviço é obrigatório."), // TODO: Validar formato do preço (ex: numérico ou string formatada)
    (0, express_validator_1.body)("duration").trim().notEmpty().withMessage("A duração do serviço é obrigatória."), // TODO: Validar formato da duração (ex: "60 min")
    (0, express_validator_1.body)("category").trim().notEmpty().withMessage("A categoria do serviço é obrigatória."),
    (0, express_validator_1.body)("companyId").isUUID().withMessage("ID da empresa inválido."),
    (0, express_validator_1.body)("image").optional().trim().isURL().withMessage("URL da imagem inválida."),
];
exports.updateServiceValidator = [
    (0, express_validator_1.param)("id").isUUID().withMessage("ID do serviço inválido."),
    (0, express_validator_1.body)("name").optional().trim().notEmpty().withMessage("O nome do serviço não pode ser vazio."),
    (0, express_validator_1.body)("description").optional().trim().notEmpty().withMessage("A descrição do serviço não pode ser vazia."),
    (0, express_validator_1.body)("price").optional().trim().notEmpty().withMessage("O preço do serviço é obrigatório."), // TODO: Validar formato
    (0, express_validator_1.body)("duration").optional().trim().notEmpty().withMessage("A duração do serviço é obrigatória."), // TODO: Validar formato
    (0, express_validator_1.body)("category").optional().trim().notEmpty().withMessage("A categoria do serviço é obrigatória."),
    (0, express_validator_1.body)("image").optional({ nullable: true }).trim().isURL().withMessage("URL da imagem inválida."),
    // companyId geralmente não é atualizado, mas se for necessário, adicionar validação
    // body("companyId").optional().isUUID().withMessage("ID da empresa inválido."),
];
exports.serviceIdValidator = [
    (0, express_validator_1.param)("id").isUUID().withMessage("ID do serviço inválido."),
];
