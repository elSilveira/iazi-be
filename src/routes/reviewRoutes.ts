import { Router } from "express";
import {
  getAllReviews, // Assumindo que existe no controller
  getReviewById, // Assumindo que existe no controller
  createReview, // Assumindo que existe no controller
  updateReview, // Assumindo que existe no controller
  deleteReview // Assumindo que existe no controller
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
router.get("/", getAllReviews);

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

