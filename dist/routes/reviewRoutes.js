"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express"); // Import Request, Response, NextFunction
const reviewController_1 = require("../controllers/reviewController");
const reviewValidators_1 = require("../validators/reviewValidators");
const validationMiddleware_1 = require("../middlewares/validationMiddleware"); // Corrected import
const authMiddleware_1 = require("../middlewares/authMiddleware"); // Corrected import
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler")); // Import asyncHandler
const router = (0, express_1.Router)();
// Usar spread operator para desestruturar arrays de validadores na chamada da rota
// A rota GET para listar reviews geralmente não precisa de autenticação, mas pode precisar dependendo da lógica de negócios.
// Se for pública, remover asyncHandler(authMiddleware).
// Se precisar de autenticação, adicionar asyncHandler(authMiddleware).
// Assumindo que é pública por enquanto:
router.get("/", /* ...getReviewsValidator, */ validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)(reviewController_1.getReviews)); // Corrected: validateRequest
// Rota para obter uma review específica por ID. Geralmente pública.
router.get("/:id", ...reviewValidators_1.reviewIdValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)(reviewController_1.getReviewById)); // Corrected: validateRequest
// Rotas que modificam dados (POST, PUT, DELETE) geralmente requerem autenticação.
// Usar asyncHandler(authMiddleware) para aplicar o middleware de autenticação.
// Usar spread operator para desestruturar arrays de validadores na chamada da rota
router.post("/", (0, asyncHandler_1.default)(authMiddleware_1.authMiddleware), ...reviewValidators_1.createReviewValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)(reviewController_1.createReview)); // Corrected: authMiddleware, validateRequest
router.put("/:id", (0, asyncHandler_1.default)(authMiddleware_1.authMiddleware), ...reviewValidators_1.updateReviewValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)(reviewController_1.updateReview)); // Corrected: authMiddleware, validateRequest
router.delete("/:id", (0, asyncHandler_1.default)(authMiddleware_1.authMiddleware), ...reviewValidators_1.reviewIdValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.default)(reviewController_1.deleteReview)); // Corrected: authMiddleware, validateRequest
exports.default = router;
