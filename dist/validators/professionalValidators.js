"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.professionalServiceAssociationValidator = exports.professionalIdValidator = exports.updateProfessionalValidator = exports.createProfessionalValidator = void 0;
const express_validator_1 = require("express-validator");
// Common sub-validators for nested arrays
const experienceItemValidator = [
    (0, express_validator_1.body)("experiences.*.title").trim().notEmpty().withMessage("O título da experiência é obrigatório."),
    (0, express_validator_1.body)("experiences.*.companyName").trim().notEmpty().withMessage("O nome da empresa na experiência é obrigatório."),
    (0, express_validator_1.body)("experiences.*.startDate").isISO8601().toDate().withMessage("Data de início da experiência inválida."),
    (0, express_validator_1.body)("experiences.*.endDate").optional({ nullable: true }).isISO8601().toDate().withMessage("Data de término da experiência inválida."),
    (0, express_validator_1.body)("experiences.*.description").optional({ nullable: true }).trim(),
    (0, express_validator_1.body)("experiences.*.isCurrent").optional().isBoolean().withMessage("Valor inválido para 'isCurrent' na experiência.")
];
const educationItemValidator = [
    (0, express_validator_1.body)("education.*.institution").trim().notEmpty().withMessage("O nome da instituição de ensino é obrigatório."),
    (0, express_validator_1.body)("education.*.degree").trim().notEmpty().withMessage("O grau obtido na formação é obrigatório."),
    (0, express_validator_1.body)("education.*.fieldOfStudy").trim().notEmpty().withMessage("A área de estudo da formação é obrigatória."),
    (0, express_validator_1.body)("education.*.startDate").isISO8601().toDate().withMessage("Data de início da formação inválida."),
    (0, express_validator_1.body)("education.*.endDate").optional({ nullable: true }).isISO8601().toDate().withMessage("Data de término da formação inválida."),
    (0, express_validator_1.body)("education.*.description").optional({ nullable: true }).trim()
];
const availabilityItemValidator = [
    (0, express_validator_1.body)("availability.*.dayOfWeek").trim().notEmpty().isIn(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]).withMessage("Dia da semana inválido para disponibilidade."),
    (0, express_validator_1.body)("availability.*.startTime").matches(/^([01]\\d|2[0-3]):([0-5]\\d)$/).withMessage("Hora de início da disponibilidade inválida (HH:MM)."),
    (0, express_validator_1.body)("availability.*.endTime").matches(/^([01]\\d|2[0-3]):([0-5]\\d)$/).withMessage("Hora de término da disponibilidade inválida (HH:MM).")
];
const portfolioItemValidator = [
    (0, express_validator_1.body)("portfolio.*.imageUrl").trim().isURL().withMessage("URL da imagem do portfólio inválida."),
    (0, express_validator_1.body)("portfolio.*.description").optional({ nullable: true }).trim()
];
exports.createProfessionalValidator = [
    (0, express_validator_1.body)("name").optional().trim().notEmpty().withMessage("O nome do profissional não pode ser vazio, se fornecido."),
    (0, express_validator_1.body)("role").optional().trim().notEmpty().withMessage("O cargo do profissional não pode ser vazio, se fornecido."),
    (0, express_validator_1.body)("companyId").optional().isUUID().withMessage("ID da empresa inválido, se fornecido."),
    (0, express_validator_1.body)("image").optional({ nullable: true }).trim().isURL().withMessage("URL da imagem inválida."),
    (0, express_validator_1.body)("bio").optional({ nullable: true }).trim(),
    (0, express_validator_1.body)("phone").optional({ nullable: true }).trim(),
    (0, express_validator_1.body)("serviceIds").optional().isArray().withMessage("serviceIds deve ser um array."),
    (0, express_validator_1.body)("serviceIds.*").optional().isUUID().withMessage("Cada ID de serviço em serviceIds deve ser um UUID válido."),
    (0, express_validator_1.body)("experiences").optional().isArray().withMessage("Experiências deve ser um array."),
    ...experienceItemValidator,
    (0, express_validator_1.body)("education").optional().isArray().withMessage("Formações deve ser um array."),
    ...educationItemValidator,
    (0, express_validator_1.body)("availability").optional().isArray().withMessage("Disponibilidade deve ser um array."),
    ...availabilityItemValidator,
    (0, express_validator_1.body)("portfolio").optional().isArray().withMessage("Portfólio deve ser um array."),
    ...portfolioItemValidator
];
exports.updateProfessionalValidator = [
    (0, express_validator_1.param)("id").isUUID().withMessage("ID do profissional inválido."),
    (0, express_validator_1.body)("name").optional().trim().notEmpty().withMessage("O nome do profissional não pode ser vazio."),
    (0, express_validator_1.body)("role").optional().trim().notEmpty().withMessage("O cargo do profissional não pode ser vazio."),
    (0, express_validator_1.body)("image").optional({ nullable: true }).trim().isURL().withMessage("URL da imagem inválida."),
    (0, express_validator_1.body)("bio").optional({ nullable: true }).trim(),
    (0, express_validator_1.body)("phone").optional({ nullable: true }).trim(),
    (0, express_validator_1.body)("serviceIds").optional().isArray().withMessage("serviceIds deve ser um array."),
    (0, express_validator_1.body)("serviceIds.*").optional().isUUID().withMessage("Cada ID de serviço em serviceIds deve ser um UUID válido."),
    (0, express_validator_1.body)("experiences").optional().isArray().withMessage("Experiências deve ser um array."),
    ...experienceItemValidator,
    (0, express_validator_1.body)("education").optional().isArray().withMessage("Formações deve ser um array."),
    ...educationItemValidator,
    (0, express_validator_1.body)("availability").optional().isArray().withMessage("Disponibilidade deve ser um array."),
    ...availabilityItemValidator,
    (0, express_validator_1.body)("portfolio").optional().isArray().withMessage("Portfólio deve ser um array."),
    ...portfolioItemValidator
];
exports.professionalIdValidator = [
    (0, express_validator_1.param)("id").isUUID().withMessage("ID do profissional inválido."),
];
exports.professionalServiceAssociationValidator = [
    (0, express_validator_1.param)("professionalId").isUUID().withMessage("ID do profissional inválido."),
    (0, express_validator_1.body)("serviceId").isUUID().withMessage("ID do serviço inválido."),
    (0, express_validator_1.body)("price").optional().trim().notEmpty().withMessage("O preço específico não pode ser vazio."),
];
