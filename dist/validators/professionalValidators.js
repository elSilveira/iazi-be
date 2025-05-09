"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.professionalServiceAssociationValidator = exports.professionalIdValidator = exports.updateProfessionalValidator = exports.createProfessionalValidator = void 0;
const express_validator_1 = require("express-validator");
// Novo validador para o contrato atualizado
const experienceItemValidator = [
    (0, express_validator_1.body)("experiences").optional().isArray().withMessage("Experiências deve ser um array."),
    (0, express_validator_1.body)("experiences.*.title").trim().notEmpty().withMessage("O título da experiência é obrigatório."),
    (0, express_validator_1.body)("experiences.*.companyName").trim().notEmpty().withMessage("O nome da empresa na experiência é obrigatório."),
    (0, express_validator_1.body)("experiences.*.startDate").trim().notEmpty().withMessage("Data de início da experiência é obrigatória.").matches(/^\d{4}-\d{2}(-\d{2})?$/).withMessage("Data de início deve ser YYYY-MM ou YYYY-MM-DD"),
    (0, express_validator_1.body)("experiences.*.endDate").optional({ nullable: true }).matches(/^\d{4}-\d{2}(-\d{2})?$/).withMessage("Data de término deve ser YYYY-MM ou YYYY-MM-DD"),
    (0, express_validator_1.body)("experiences.*.description").optional({ nullable: true }).trim()
];
const educationItemValidator = [
    (0, express_validator_1.body)("educations").optional().isArray().withMessage("Formações deve ser um array."),
    (0, express_validator_1.body)("educations.*.institutionName").trim().notEmpty().withMessage("O nome da instituição de ensino é obrigatório."),
    (0, express_validator_1.body)("educations.*.degree").trim().notEmpty().withMessage("O grau obtido na formação é obrigatório."),
    (0, express_validator_1.body)("educations.*.fieldOfStudy").trim().notEmpty().withMessage("A área de estudo da formação é obrigatória."),
    (0, express_validator_1.body)("educations.*.startDate").trim().notEmpty().withMessage("Data de início da formação é obrigatória.").matches(/^\d{4}-\d{2}(-\d{2})?$/).withMessage("Data de início deve ser YYYY-MM ou YYYY-MM-DD"),
    (0, express_validator_1.body)("educations.*.endDate").optional({ nullable: true }).matches(/^\d{4}-\d{2}(-\d{2})?$/).withMessage("Data de término deve ser YYYY-MM ou YYYY-MM-DD"),
    (0, express_validator_1.body)("educations.*.description").optional({ nullable: true }).trim()
];
const serviceItemValidator = [
    (0, express_validator_1.body)("services").optional().isArray().withMessage("Serviços deve ser um array."),
    (0, express_validator_1.body)("services.*.serviceId").notEmpty().isUUID().withMessage("serviceId deve ser um UUID válido."),
    (0, express_validator_1.body)("services.*.price").notEmpty().isNumeric().withMessage("O preço do serviço é obrigatório e deve ser numérico.")
];
const availabilityItemValidator = [
    (0, express_validator_1.body)("availability").optional().isArray().withMessage("Disponibilidade deve ser um array."),
    (0, express_validator_1.body)("availability.*.day_of_week").trim().notEmpty().isIn(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]).withMessage("Dia da semana inválido para disponibilidade."),
    (0, express_validator_1.body)("availability.*.start_time").matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage("Hora de início da disponibilidade inválida (HH:mm)."),
    (0, express_validator_1.body)("availability.*.end_time").matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage("Hora de término da disponibilidade inválida (HH:mm).")
];
const portfolioItemValidator = [
    (0, express_validator_1.body)("portfolioItems").optional().isArray().withMessage("Portfólio deve ser um array."),
    (0, express_validator_1.body)("portfolioItems.*.imageUrl").trim().isURL().withMessage("URL da imagem do portfólio inválida."),
    (0, express_validator_1.body)("portfolioItems.*.description").optional({ nullable: true }).trim()
];
exports.createProfessionalValidator = [
    (0, express_validator_1.body)("name").notEmpty().trim().withMessage("O nome do profissional é obrigatório."),
    (0, express_validator_1.body)("role").notEmpty().trim().withMessage("O cargo do profissional é obrigatório."),
    (0, express_validator_1.body)("companyId").optional().isUUID().withMessage("ID da empresa deve ser UUID, se fornecido."),
    (0, express_validator_1.body)("image").notEmpty().trim().isURL().withMessage("URL da imagem é obrigatória e deve ser válida."),
    (0, express_validator_1.body)("bio").notEmpty().trim().withMessage("A bio é obrigatória."),
    (0, express_validator_1.body)("phone").notEmpty().trim().withMessage("O telefone é obrigatório."),
    ...experienceItemValidator, // experiences é opcional
    ...educationItemValidator, // educations é opcional
    ...serviceItemValidator, // services é opcional
    ...availabilityItemValidator, // availability é opcional
    ...portfolioItemValidator // portfolioItems é opcional
];
exports.updateProfessionalValidator = [
    (0, express_validator_1.param)("id").isUUID().withMessage("ID do profissional inválido."),
    ...exports.createProfessionalValidator // Permite os mesmos campos do create
];
exports.professionalIdValidator = [
    (0, express_validator_1.param)("id").isUUID().withMessage("ID do profissional inválido."),
];
exports.professionalServiceAssociationValidator = [
    (0, express_validator_1.param)("professionalId").isUUID().withMessage("ID do profissional inválido."),
    (0, express_validator_1.body)("serviceId").isUUID().withMessage("ID do serviço inválido."),
    (0, express_validator_1.body)("price").optional().isNumeric().withMessage("O preço específico deve ser numérico."),
];
