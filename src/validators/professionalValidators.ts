import { body, param } from "express-validator";

// Novo validador para o contrato atualizado
const experienceItemValidator = [
  body("experiences").optional().isArray().withMessage("Experiências deve ser um array."),
  body("experiences.*.title").trim().notEmpty().withMessage("O título da experiência é obrigatório."),
  body("experiences.*.companyName").trim().notEmpty().withMessage("O nome da empresa na experiência é obrigatório."),
  body("experiences.*.startDate").trim().notEmpty().withMessage("Data de início da experiência é obrigatória.").matches(/^\d{4}-\d{2}(-\d{2})?$/).withMessage("Data de início deve ser YYYY-MM ou YYYY-MM-DD"),
  body("experiences.*.endDate").optional({ nullable: true }).matches(/^\d{4}-\d{2}(-\d{2})?$/).withMessage("Data de término deve ser YYYY-MM ou YYYY-MM-DD"),
  body("experiences.*.description").optional({ nullable: true }).trim()
];

const educationItemValidator = [
  body("educations").optional().isArray().withMessage("Formações deve ser um array."),
  body("educations.*.institutionName").trim().notEmpty().withMessage("O nome da instituição de ensino é obrigatório."),
  body("educations.*.degree").trim().notEmpty().withMessage("O grau obtido na formação é obrigatório."),
  body("educations.*.fieldOfStudy").trim().notEmpty().withMessage("A área de estudo da formação é obrigatória."),
  body("educations.*.startDate").trim().notEmpty().withMessage("Data de início da formação é obrigatória.").matches(/^\d{4}-\d{2}(-\d{2})?$/).withMessage("Data de início deve ser YYYY-MM ou YYYY-MM-DD"),
  body("educations.*.endDate").optional({ nullable: true }).matches(/^\d{4}-\d{2}(-\d{2})?$/).withMessage("Data de término deve ser YYYY-MM ou YYYY-MM-DD"),
  body("educations.*.description").optional({ nullable: true }).trim()
];

const serviceItemValidator = [
  body("services").optional().isArray().withMessage("Serviços deve ser um array."),
  body("services.*.serviceId").notEmpty().isUUID().withMessage("serviceId deve ser um UUID válido."),
  body("services.*.price").notEmpty().isNumeric().withMessage("O preço do serviço é obrigatório e deve ser numérico.")
];

const availabilityItemValidator = [
  body("availability").optional().isArray().withMessage("Disponibilidade deve ser um array."),
  body("availability.*.day_of_week").trim().notEmpty().isIn(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]).withMessage("Dia da semana inválido para disponibilidade."),
  body("availability.*.start_time").matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage("Hora de início da disponibilidade inválida (HH:mm)."),
  body("availability.*.end_time").matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage("Hora de término da disponibilidade inválida (HH:mm).")
];

const portfolioItemValidator = [
  body("portfolioItems").optional().isArray().withMessage("Portfólio deve ser um array."),
  body("portfolioItems.*.imageUrl").trim().isURL().withMessage("URL da imagem do portfólio inválida."),
  body("portfolioItems.*.description").optional({ nullable: true }).trim()
];

export const createProfessionalValidator = [
  body("name").notEmpty().trim().withMessage("O nome do profissional é obrigatório."),
  body("role").notEmpty().trim().withMessage("O cargo do profissional é obrigatório."),
  body("companyId").optional().isUUID().withMessage("ID da empresa deve ser UUID, se fornecido."),
  body("image").notEmpty().trim().isURL().withMessage("URL da imagem é obrigatória e deve ser válida."),
  body("bio").notEmpty().trim().withMessage("A bio é obrigatória."),
  body("phone").notEmpty().trim().withMessage("O telefone é obrigatório."),
  ...experienceItemValidator, // experiences é opcional
  ...educationItemValidator,  // educations é opcional
  ...serviceItemValidator,    // services é opcional
  ...availabilityItemValidator, // availability é opcional
  ...portfolioItemValidator   // portfolioItems é opcional
];

export const updateProfessionalValidator = [
  param("id").isUUID().withMessage("ID do profissional inválido."),
  ...createProfessionalValidator // Permite os mesmos campos do create
];

export const professionalIdValidator = [
  param("id").isUUID().withMessage("ID do profissional inválido."),
];

export const professionalServiceAssociationValidator = [
  param("professionalId").isUUID().withMessage("ID do profissional inválido."),
  body("serviceId").isUUID().withMessage("ID do serviço inválido."),
  body("price").optional().isNumeric().withMessage("O preço específico deve ser numérico."),
];

