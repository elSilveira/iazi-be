"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    // Log request body shape for debugging validation issues in production for appointment endpoint
    if (req.path.includes('/appointments') && req.method === 'POST') {
        console.log(`[Validation Middleware] POST /appointments - Body keys: ${Object.keys(req.body).join(', ')}`);
        // Log critical fields format without sensitive data
        if (req.body.serviceIds) {
            console.log(`[Validation Middleware] serviceIds type: ${typeof req.body.serviceIds}, isArray: ${Array.isArray(req.body.serviceIds)}`);
        }
        else {
            console.log('[Validation Middleware] serviceIds field not found in request body');
        }
    }
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
