import { body, param } from "express-validator";

// Common sub-validators for nested arrays
const experienceItemValidator = [
  body("experiences.*.title").trim().notEmpty().withMessage("O título da experiência é obrigatório."),
  body("experiences.*.companyName").trim().notEmpty().withMessage("O nome da empresa na experiência é obrigatório."),
  body("experiences.*.startDate").isISO8601().toDate().withMessage("Data de início da experiência inválida."),
  body("experiences.*.endDate").optional({ nullable: true }).isISO8601().toDate().withMessage("Data de término da experiência inválida."),
  body("experiences.*.description").optional({ nullable: true }).trim(),
  body("experiences.*.isCurrent").optional().isBoolean().withMessage("Valor inválido para 'isCurrent' na experiência.")
];

const educationItemValidator = [
  body("education.*.institution").trim().notEmpty().withMessage("O nome da instituição de ensino é obrigatório."),
  body("education.*.degree").trim().notEmpty().withMessage("O grau obtido na formação é obrigatório."),
  body("education.*.fieldOfStudy").trim().notEmpty().withMessage("A área de estudo da formação é obrigatória."),
  body("education.*.startDate").isISO8601().toDate().withMessage("Data de início da formação inválida."),
  body("education.*.endDate").optional({ nullable: true }).isISO8601().toDate().withMessage("Data de término da formação inválida."),
  body("education.*.description").optional({ nullable: true }).trim()
];

const availabilityItemValidator = [
  body("availability.*.dayOfWeek").trim().notEmpty().isIn(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]).withMessage("Dia da semana inválido para disponibilidade."),
  body("availability.*.startTime").matches(/^([01]\\d|2[0-3]):([0-5]\\d)$/).withMessage("Hora de início da disponibilidade inválida (HH:MM)."),
  body("availability.*.endTime").matches(/^([01]\\d|2[0-3]):([0-5]\\d)$/).withMessage("Hora de término da disponibilidade inválida (HH:MM).")
];

const portfolioItemValidator = [
  body("portfolio.*.imageUrl").trim().isURL().withMessage("URL da imagem do portfólio inválida."),
  body("portfolio.*.description").optional({ nullable: true }).trim()
];

export const createProfessionalValidator = [
  body("name").optional().trim().notEmpty().withMessage("O nome do profissional não pode ser vazio, se fornecido."),
  body("role").optional().trim().notEmpty().withMessage("O cargo do profissional não pode ser vazio, se fornecido."),
  body("companyId").optional().isUUID().withMessage("ID da empresa inválido, se fornecido."),
  body("image").optional({ nullable: true }).trim().isURL().withMessage("URL da imagem inválida."),
  body("bio").optional({ nullable: true }).trim(),
  body("phone").optional({ nullable: true }).trim(), 
  body("serviceIds").optional().isArray().withMessage("serviceIds deve ser um array."),
  body("serviceIds.*").optional().isUUID().withMessage("Cada ID de serviço em serviceIds deve ser um UUID válido."),
  body("experiences").optional().isArray().withMessage("Experiências deve ser um array."),
  ...experienceItemValidator,
  body("education").optional().isArray().withMessage("Formações deve ser um array."),
  ...educationItemValidator,
  body("availability").optional().isArray().withMessage("Disponibilidade deve ser um array."),
  ...availabilityItemValidator,
  body("portfolio").optional().isArray().withMessage("Portfólio deve ser um array."),
  ...portfolioItemValidator
];

export const updateProfessionalValidator = [
  param("id").isUUID().withMessage("ID do profissional inválido."),
  body("name").optional().trim().notEmpty().withMessage("O nome do profissional não pode ser vazio."),
  body("role").optional().trim().notEmpty().withMessage("O cargo do profissional não pode ser vazio."),
  body("image").optional({ nullable: true }).trim().isURL().withMessage("URL da imagem inválida."),
  body("bio").optional({ nullable: true }).trim(),
  body("phone").optional({ nullable: true }).trim(),
  body("serviceIds").optional().isArray().withMessage("serviceIds deve ser um array."),
  body("serviceIds.*").optional().isUUID().withMessage("Cada ID de serviço em serviceIds deve ser um UUID válido."),
  body("experiences").optional().isArray().withMessage("Experiências deve ser um array."),
  ...experienceItemValidator,
  body("education").optional().isArray().withMessage("Formações deve ser um array."),
  ...educationItemValidator,
  body("availability").optional().isArray().withMessage("Disponibilidade deve ser um array."),
  ...availabilityItemValidator,
  body("portfolio").optional().isArray().withMessage("Portfólio deve ser um array."),
  ...portfolioItemValidator
];

export const professionalIdValidator = [
  param("id").isUUID().withMessage("ID do profissional inválido."),
];

export const professionalServiceAssociationValidator = [
  param("professionalId").isUUID().withMessage("ID do profissional inválido."),
  body("serviceId").isUUID().withMessage("ID do serviço inválido."),
  body("price").optional().trim().notEmpty().withMessage("O preço específico não pode ser vazio."),
];

