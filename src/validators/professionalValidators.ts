import { body, param } from "express-validator";

export const createProfessionalValidator = [
  // Name and Role are now optional in the validator; the controller should handle defaults
  body("name").optional().trim().notEmpty().withMessage("O nome do profissional não pode ser vazio, se fornecido."),
  body("role").optional().trim().notEmpty().withMessage("O cargo do profissional não pode ser vazio, se fornecido."),
  // CompanyId is now optional
  body("companyId").optional().isUUID().withMessage("ID da empresa inválido, se fornecido."),
  body("image").optional().trim().isURL().withMessage("URL da imagem inválida."),
  // Add validation for other fields from UserProfessionalInfo if needed (e.g., bio, phone)
  body("bio").optional().trim(),
  body("phone").optional().trim(), // Add more specific phone validation if required
  // Consider validating experience and education arrays if they are part of the creation payload
];

export const updateProfessionalValidator = [
  param("id").isUUID().withMessage("ID do profissional inválido."),
  body("name").optional().trim().notEmpty().withMessage("O nome do profissional não pode ser vazio."),
  body("role").optional().trim().notEmpty().withMessage("O cargo do profissional não pode ser vazio."),
  body("image").optional({ nullable: true }).trim().isURL().withMessage("URL da imagem inválida."),
  body("bio").optional({ nullable: true }).trim(),
  body("phone").optional({ nullable: true }).trim(),
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

