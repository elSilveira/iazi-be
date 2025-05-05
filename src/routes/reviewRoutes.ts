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
import { handleValidationErrors } from "../middlewares/validationMiddleware";
import { protect } from "../middlewares/authMiddleware"; // Importar protect
import asyncHandler from "../utils/asyncHandler"; // Import asyncHandler

const router = Router();

// Usar spread operator para desestruturar arrays de validadores na chamada da rota
// A rota GET para listar reviews geralmente não precisa de autenticação, mas pode precisar dependendo da lógica de negócios.
// Se for pública, remover asyncHandler(protect).
// Se precisar de autenticação, adicionar asyncHandler(protect).
// Assumindo que é pública por enquanto:
router.get("/", /* ...getReviewsValidator, */ handleValidationErrors, asyncHandler(getReviews)); // getReviewsValidator comentado/removido, validateRequest -> handleValidationErrors

// Rota para obter uma review específica por ID. Geralmente pública.
router.get("/:id", ...reviewIdValidator, handleValidationErrors, asyncHandler(getReviewById)); // validateRequest -> handleValidationErrors

// Rotas que modificam dados (POST, PUT, DELETE) geralmente requerem autenticação.
// Usar asyncHandler(protect) para aplicar o middleware de autenticação.
// Usar spread operator para desestruturar arrays de validadores na chamada da rota
router.post("/", asyncHandler(protect), ...createReviewValidator, handleValidationErrors, asyncHandler(createReview)); // authMiddleware -> protect, validateRequest -> handleValidationErrors

router.put("/:id", asyncHandler(protect), ...updateReviewValidator, handleValidationErrors, asyncHandler(updateReview)); // authMiddleware -> protect, validateRequest -> handleValidationErrors

router.delete("/:id", asyncHandler(protect), ...reviewIdValidator, handleValidationErrors, asyncHandler(deleteReview)); // authMiddleware -> protect, validateRequest -> handleValidationErrors

export default router;

