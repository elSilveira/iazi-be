"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginValidator = exports.registerValidator = void 0;
const express_validator_1 = require("express-validator");
exports.registerValidator = [
    (0, express_validator_1.body)("email")
        .trim()
        .notEmpty().withMessage("O email é obrigatório.")
        .isEmail().withMessage("Formato de email inválido.")
        .normalizeEmail(),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 }).withMessage("A senha deve ter no mínimo 6 caracteres."),
    (0, express_validator_1.body)("name")
        .trim()
        .notEmpty().withMessage("O nome é obrigatório.")
        .isLength({ min: 2 }).withMessage("O nome deve ter no mínimo 2 caracteres."),
    (0, express_validator_1.body)("avatar")
        .optional()
        .trim()
        .isURL().withMessage("URL do avatar inválida."),
];
exports.loginValidator = [
    (0, express_validator_1.body)("email")
        .trim()
        .notEmpty().withMessage("O email é obrigatório.")
        .isEmail().withMessage("Formato de email inválido.")
        .normalizeEmail(),
    (0, express_validator_1.body)("password")
        .notEmpty().withMessage("A senha é obrigatória."),
];
