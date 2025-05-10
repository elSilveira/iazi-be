"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        // Retorna todas as mensagens de erro detalhadas
        const errorDetails = errors.array().map(err => ({
            field: err.param,
            message: err.msg,
            value: err.value
        }));
        res.status(400).json({ message: "Erro de validação", errors: errorDetails });
        return;
    }
    next();
};
exports.validateRequest = validateRequest;
