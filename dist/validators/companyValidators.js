"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyIdValidator = exports.updateCompanyValidator = exports.createCompanyValidator = void 0;
const express_validator_1 = require("express-validator");
// Validador para o endereço (usado em create e update)
const addressValidator = [
    (0, express_validator_1.body)("address.street").trim().notEmpty().withMessage("A rua do endereço é obrigatória."),
    (0, express_validator_1.body)("address.number").trim().notEmpty().withMessage("O número do endereço é obrigatório."),
    (0, express_validator_1.body)("address.neighborhood").trim().notEmpty().withMessage("O bairro do endereço é obrigatório."),
    (0, express_validator_1.body)("address.city").trim().notEmpty().withMessage("A cidade do endereço é obrigatória."),
    (0, express_validator_1.body)("address.state").trim().notEmpty().withMessage("O estado do endereço é obrigatório.").isLength({ min: 2, max: 2 }).withMessage("O estado deve ter 2 caracteres (UF)."),
    (0, express_validator_1.body)("address.zipCode").trim().notEmpty().withMessage("O CEP do endereço é obrigatório.").isPostalCode("BR").withMessage("CEP inválido."),
    (0, express_validator_1.body)("address.complement").optional().trim(),
];
// Validador para horários de funcionamento (usado em create e update)
// Validação básica, pode ser mais complexa dependendo da estrutura exata esperada
const workingHoursValidator = [
    (0, express_validator_1.body)("workingHours").optional().isJSON().withMessage("Horários de funcionamento devem estar em formato JSON."),
    // TODO: Adicionar validação mais específica para a estrutura interna do JSON (open, close, isOpen para cada dia)
];
exports.createCompanyValidator = [
    (0, express_validator_1.body)("name").trim().notEmpty().withMessage("O nome da empresa é obrigatório."),
    (0, express_validator_1.body)("description").trim().notEmpty().withMessage("A descrição da empresa é obrigatória."),
    (0, express_validator_1.body)("logo").optional().trim().isURL().withMessage("URL do logo inválida."),
    (0, express_validator_1.body)("coverImage").optional().trim().isURL().withMessage("URL da imagem de capa inválida."),
    (0, express_validator_1.body)("yearEstablished").optional().trim().isNumeric().withMessage("Ano de estabelecimento deve ser numérico."),
    (0, express_validator_1.body)("phone").optional().trim().isMobilePhone("pt-BR").withMessage("Número de telefone inválido."),
    (0, express_validator_1.body)("email").optional().trim().isEmail().withMessage("Email da empresa inválido.").normalizeEmail(),
    (0, express_validator_1.body)("categories").isArray({ min: 1 }).withMessage("A empresa deve ter pelo menos uma categoria."),
    (0, express_validator_1.body)("categories.*").trim().notEmpty().withMessage("Categoria não pode ser vazia."),
    ...addressValidator,
    ...workingHoursValidator,
];
exports.updateCompanyValidator = [
    (0, express_validator_1.param)("id").isUUID().withMessage("ID da empresa inválido."),
    (0, express_validator_1.body)("name").optional().trim().notEmpty().withMessage("O nome da empresa não pode ser vazio."),
    (0, express_validator_1.body)("description").optional().trim().notEmpty().withMessage("A descrição da empresa não pode ser vazia."),
    (0, express_validator_1.body)("logo").optional({ nullable: true }).trim().isURL().withMessage("URL do logo inválida."),
    (0, express_validator_1.body)("coverImage").optional({ nullable: true }).trim().isURL().withMessage("URL da imagem de capa inválida."),
    (0, express_validator_1.body)("yearEstablished").optional({ nullable: true }).trim().isNumeric().withMessage("Ano de estabelecimento deve ser numérico."),
    (0, express_validator_1.body)("phone").optional({ nullable: true }).trim().isMobilePhone("pt-BR").withMessage("Número de telefone inválido."),
    (0, express_validator_1.body)("email").optional({ nullable: true }).trim().isEmail().withMessage("Email da empresa inválido.").normalizeEmail(),
    (0, express_validator_1.body)("categories").optional().isArray({ min: 1 }).withMessage("A empresa deve ter pelo menos uma categoria."),
    (0, express_validator_1.body)("categories.*").optional().trim().notEmpty().withMessage("Categoria não pode ser vazia."),
    // Permite atualização parcial do endereço
    (0, express_validator_1.body)("address.street").optional().trim().notEmpty().withMessage("A rua do endereço é obrigatória."),
    (0, express_validator_1.body)("address.number").optional().trim().notEmpty().withMessage("O número do endereço é obrigatório."),
    (0, express_validator_1.body)("address.neighborhood").optional().trim().notEmpty().withMessage("O bairro do endereço é obrigatório."),
    (0, express_validator_1.body)("address.city").optional().trim().notEmpty().withMessage("A cidade do endereço é obrigatória."),
    (0, express_validator_1.body)("address.state").optional().trim().notEmpty().withMessage("O estado do endereço é obrigatório.").isLength({ min: 2, max: 2 }).withMessage("O estado deve ter 2 caracteres (UF)."),
    (0, express_validator_1.body)("address.zipCode").optional().trim().notEmpty().withMessage("O CEP do endereço é obrigatório.").isPostalCode("BR").withMessage("CEP inválido."),
    (0, express_validator_1.body)("address.complement").optional({ nullable: true }).trim(),
    // Permite atualização parcial dos horários
    (0, express_validator_1.body)("workingHours").optional({ nullable: true }).isJSON().withMessage("Horários de funcionamento devem estar em formato JSON."),
];
exports.companyIdValidator = [
    (0, express_validator_1.param)("id").isUUID().withMessage("ID da empresa inválido."),
];
