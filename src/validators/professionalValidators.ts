import { body, param } from "express-validator";

export const createProfessionalValidator = [
  body("name").trim().notEmpty().withMessage("O nome do profissional é obrigatório."),
  body("role").trim().notEmpty().withMessage("O cargo do profissional é obrigatório."),
  body("companyId").isUUID().withMessage("ID da empresa inválido."),
  body("image").optional().trim().isURL().withMessage("URL da imagem inválida."),
  // rating e appointments são geralmente calculados, não definidos na criação
];

export const updateProfessionalValidator = [
  param("id").isUUID().withMessage("ID do profissional inválido."),
  body("name").optional().trim().notEmpty().withMessage("O nome do profissional não pode ser vazio."),
  body("role").optional().trim().notEmpty().withMessage("O cargo do profissional não pode ser vazio."),
  body("image").optional({ nullable: true }).trim().isURL().withMessage("URL da imagem inválida."),
  // companyId geralmente não é atualizado
];

export const professionalIdValidator = [
  param("id").isUUID().withMessage("ID do profissional inválido."),
];

// Validador para associar/desassociar serviços a um profissional
export const professionalServiceAssociationValidator = [
  param("professionalId").isUUID().withMessage("ID do profissional inválido."),
  body("serviceId").isUUID().withMessage("ID do serviço inválido."),
  body("price").optional().trim().notEmpty().withMessage("O preço específico não pode ser vazio."), // Validar formato se necessário
];

