"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserValidator = void 0;
const express_validator_1 = require("express-validator");
exports.updateUserValidator = [
    (0, express_validator_1.body)("email")
        .optional()
        .isEmail()
        .withMessage("Formato de email inválido.")
        .normalizeEmail(),
    (0, express_validator_1.body)("name")
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage("Nome não pode ser vazio."),
    (0, express_validator_1.body)("password")
        .optional()
        .isLength({ min: 6 })
        .withMessage("Senha deve ter pelo menos 6 caracteres."),
    (0, express_validator_1.body)("avatar")
        .optional()
        .isURL()
        .withMessage("URL do avatar inválida."),
];
