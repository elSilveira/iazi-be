import { Router } from "express";
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
} from "../validators/reviewValidators";
import { validateRequest } from "../middlewares/validationMiddleware";
// TODO: Adicionar middleware de autenticação (obrigatório para criar, atualizar, deletar)

const router = Router();

// Obter todas as avaliações (filtradas por serviço, profissional ou empresa)
// TODO: Adicionar validação para query params (serviceId, professionalId, companyId)
router.get("/", getReviews); // Corrigido: Usar o nome correto da função

// Obter avaliação por ID
router.get("/:id", reviewIdValidator, validateRequest, getReviewById);

// Criar nova avaliação
// O userId deve ser obtido do token JWT (middleware de autenticação)
router.post("/", createReviewValidator, validateRequest, createReview);

// Atualizar avaliação (apenas rating e comment)
router.put("/:id", updateReviewValidator, validateRequest, updateReview);

// Deletar avaliação
router.delete("/:id", reviewIdValidator, validateRequest, deleteReview);

export default router;

