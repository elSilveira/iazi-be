"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        // Retorna apenas a primeira mensagem de erro para simplificar
        const firstError = errors.array({ onlyFirstError: true })[0];
        res.status(400).json({ message: firstError.msg });
        return; // Interrompe a execução se houver erro
    }
    next(); // Prossegue para o próximo middleware/controller se não houver erros
};
exports.handleValidationErrors = handleValidationErrors;
