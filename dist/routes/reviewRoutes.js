"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express"); // Import Request, Response, NextFunction
const reviewController_1 = require("../controllers/reviewController");
const reviewValidators_1 = require("../validators/reviewValidators");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const authMiddleware_1 = require("../middlewares/authMiddleware"); // Importar authMiddleware
const asyncHandler_1 = require("../utils/asyncHandler"); // Import asyncHandler
const router = (0, express_1.Router)();
// Usar spread operator para desestruturar arrays de validadores na chamada da rota
router.get("/", /* ...getReviewsValidator, */ validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)(reviewController_1.getReviews)); // getReviewsValidator comentado/removido
router.get("/:id", ...reviewValidators_1.reviewIdValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)(reviewController_1.getReviewById));
// Adicionar asyncHandler ao authMiddleware também se ele for async
// Usar spread operator para desestruturar arrays de validadores na chamada da rota
router.post("/", (0, asyncHandler_1.asyncHandler)(authMiddleware_1.authMiddleware), ...reviewValidators_1.createReviewValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)(reviewController_1.createReview));
router.put("/:id", (0, asyncHandler_1.asyncHandler)(authMiddleware_1.authMiddleware), ...reviewValidators_1.updateReviewValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)(reviewController_1.updateReview));
router.delete("/:id", (0, asyncHandler_1.asyncHandler)(authMiddleware_1.authMiddleware), ...reviewValidators_1.reviewIdValidator, validationMiddleware_1.validateRequest, (0, asyncHandler_1.asyncHandler)(reviewController_1.deleteReview));
exports.default = router;
