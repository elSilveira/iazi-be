import { body, param } from "express-validator";

export const createServiceValidator = [
  body("name").trim().notEmpty().withMessage("O nome do serviço é obrigatório."),
  body("description").trim().notEmpty().withMessage("A descrição do serviço é obrigatória."),
  body("price").trim().notEmpty().withMessage("O preço do serviço é obrigatório."), // TODO: Validar formato do preço (ex: numérico ou string formatada)
  body("duration").trim().notEmpty().withMessage("A duração do serviço é obrigatória."), // TODO: Validar formato da duração (ex: "60 min")
  body("categoryId")
    .notEmpty().withMessage("O campo categoryId é obrigatório.")
    .bail()
    .isInt({ min: 1 }).withMessage("categoryId deve ser um número inteiro positivo."),
  body("companyId")
    .optional()
    .isUUID().withMessage("ID da empresa inválido."),
  body("image").optional().trim().isURL().withMessage("URL da imagem inválida."),
];

export const updateServiceValidator = [
  param("id").isUUID().withMessage("ID do serviço inválido."),
  body("name").optional().trim().notEmpty().withMessage("O nome do serviço não pode ser vazio."),
  body("description").optional().trim().notEmpty().withMessage("A descrição do serviço não pode ser vazia."),
  body("price").optional().trim().notEmpty().withMessage("O preço do serviço é obrigatório."), // TODO: Validar formato
  body("duration").optional().trim().notEmpty().withMessage("A duração do serviço é obrigatória."), // TODO: Validar formato
  body("categoryId")
    .optional()
    .isInt({ min: 1 }).withMessage("categoryId deve ser um número inteiro positivo."),
  body("image").optional({ nullable: true }).trim().isURL().withMessage("URL da imagem inválida."),
  // companyId geralmente não é atualizado, mas se for necessário, adicionar validação
  // body("companyId").optional().isUUID().withMessage("ID da empresa inválido."),
];

export const serviceIdValidator = [
  param("id").isUUID().withMessage("ID do serviço inválido."),
];

