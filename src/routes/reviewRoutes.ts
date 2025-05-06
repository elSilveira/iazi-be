import { Router, Request, Response, NextFunction } from "express"; // Import Request, Response, NextFunction
import {
  getReviews, // Corrigido: Usar o nome exportado pelo controller
  getReviewById,
  createReview,
  updateReview,
  deleteReview
} from "../controllers/reviewController";
import { 
  createReviewValidator, 
  updateReviewValidator, 
  reviewIdValidator
  // getReviewsValidator // Remover importação, pois não existe
} from "../validators/reviewValidators";
import { validateRequest } from "../middlewares/validationMiddleware"; // Corrected import
import { authMiddleware } from "../middlewares/authMiddleware"; // Corrected import
import asyncHandler from "../utils/asyncHandler"; // Import asyncHandler

const router = Router();

// Usar spread operator para desestruturar arrays de validadores na chamada da rota
// A rota GET para listar reviews geralmente não precisa de autenticação, mas pode precisar dependendo da lógica de negócios.
// Se for pública, remover asyncHandler(authMiddleware).
// Se precisar de autenticação, adicionar asyncHandler(authMiddleware).
// Assumindo que é pública por enquanto:
router.get("/", /* ...getReviewsValidator, */ validateRequest, asyncHandler(getReviews)); // Corrected: validateRequest

// Rota para obter uma review específica por ID. Geralmente pública.
router.get("/:id", ...reviewIdValidator, validateRequest, asyncHandler(getReviewById)); // Corrected: validateRequest

// Rotas que modificam dados (POST, PUT, DELETE) geralmente requerem autenticação.
// Usar asyncHandler(authMiddleware) para aplicar o middleware de autenticação.
// Usar spread operator para desestruturar arrays de validadores na chamada da rota
router.post("/", asyncHandler(authMiddleware), ...createReviewValidator, validateRequest, asyncHandler(createReview)); // Corrected: authMiddleware, validateRequest

router.put("/:id", asyncHandler(authMiddleware), ...updateReviewValidator, validateRequest, asyncHandler(updateReview)); // Corrected: authMiddleware, validateRequest

router.delete("/:id", asyncHandler(authMiddleware), ...reviewIdValidator, validateRequest, asyncHandler(deleteReview)); // Corrected: authMiddleware, validateRequest

export default router;

