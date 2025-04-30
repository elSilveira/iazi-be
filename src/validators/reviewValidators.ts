import { body, param } from "express-validator";

export const createReviewValidator = [
  body("rating")
    .isFloat({ min: 1, max: 5 }).withMessage("A avaliação deve ser um número entre 1 e 5."),
  body("comment").optional().trim(),
  // userId virá do token JWT
  // Pelo menos um ID de referência deve ser fornecido
  body().custom((value, { req }) => {
    if (!req.body.serviceId && !req.body.professionalId && !req.body.companyId) {
      throw new Error("Pelo menos um ID (serviço, profissional ou empresa) deve ser fornecido para a avaliação.");
    }
    return true;
  }),
  body("serviceId").optional().isUUID().withMessage("ID do serviço inválido."),
  body("professionalId").optional().isUUID().withMessage("ID do profissional inválido."),
  body("companyId").optional().isUUID().withMessage("ID da empresa inválido."),
];

export const updateReviewValidator = [
  param("id").isUUID().withMessage("ID da avaliação inválido."),
  body("rating")
    .optional()
    .isFloat({ min: 1, max: 5 }).withMessage("A avaliação deve ser um número entre 1 e 5."),
  body("comment").optional({ nullable: true }).trim(),
  // Não permitir alterar a entidade avaliada (serviceId, professionalId, companyId)
];

export const reviewIdValidator = [
  param("id").isUUID().withMessage("ID da avaliação inválido."),
];

