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
import { validateRequest } from "../middlewares/validationMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware"; // Importar authMiddleware
import asyncHandler from "../utils/asyncHandler"; // Import asyncHandler

const router = Router();

// Usar spread operator para desestruturar arrays de validadores na chamada da rota
router.get("/", /* ...getReviewsValidator, */ validateRequest, asyncHandler(getReviews)); // getReviewsValidator comentado/removido

router.get("/:id", ...reviewIdValidator, validateRequest, asyncHandler(getReviewById));

// Adicionar asyncHandler ao authMiddleware também se ele for async
// Usar spread operator para desestruturar arrays de validadores na chamada da rota
router.post("/", asyncHandler(authMiddleware), ...createReviewValidator, validateRequest, asyncHandler(createReview)); 

router.put("/:id", asyncHandler(authMiddleware), ...updateReviewValidator, validateRequest, asyncHandler(updateReview)); 

router.delete("/:id", asyncHandler(authMiddleware), ...reviewIdValidator, validateRequest, asyncHandler(deleteReview)); 

export default router;

