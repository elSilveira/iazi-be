import { body, param } from "express-validator";

// Validador para o endereço (usado em create e update)
const addressValidator = [
  body("address.street").trim().notEmpty().withMessage("A rua do endereço é obrigatória."),
  body("address.number").trim().notEmpty().withMessage("O número do endereço é obrigatório."),
  body("address.neighborhood").trim().notEmpty().withMessage("O bairro do endereço é obrigatório."),
  body("address.city").trim().notEmpty().withMessage("A cidade do endereço é obrigatória."),
  body("address.state").trim().notEmpty().withMessage("O estado do endereço é obrigatório.").isLength({ min: 2, max: 2 }).withMessage("O estado deve ter 2 caracteres (UF)."),
  body("address.zipCode").trim().notEmpty().withMessage("O CEP do endereço é obrigatório.").isPostalCode("BR").withMessage("CEP inválido."),
  body("address.complement").optional().trim(),
];

// Validador para horários de funcionamento (usado em create e update)
// Validação básica, pode ser mais complexa dependendo da estrutura exata esperada
const workingHoursValidator = [
  body("workingHours").optional().isJSON().withMessage("Horários de funcionamento devem estar em formato JSON."),
  // TODO: Adicionar validação mais específica para a estrutura interna do JSON (open, close, isOpen para cada dia)
];

export const createCompanyValidator = [
  body("name").trim().notEmpty().withMessage("O nome da empresa é obrigatório."),
  body("description").trim().notEmpty().withMessage("A descrição da empresa é obrigatória."),
  body("logo").optional().trim().isURL().withMessage("URL do logo inválida."),
  body("coverImage").optional().trim().isURL().withMessage("URL da imagem de capa inválida."),
  body("yearEstablished").optional().trim().isNumeric().withMessage("Ano de estabelecimento deve ser numérico."),
  body("phone").optional().trim().isMobilePhone("pt-BR").withMessage("Número de telefone inválido."),
  body("email").optional().trim().isEmail().withMessage("Email da empresa inválido.").normalizeEmail(),
  body("categories").isArray({ min: 1 }).withMessage("A empresa deve ter pelo menos uma categoria."),
  body("categories.*").trim().notEmpty().withMessage("Categoria não pode ser vazia."),
  ...addressValidator,
  ...workingHoursValidator,
];

export const updateCompanyValidator = [
  param("id").isUUID().withMessage("ID da empresa inválido."),
  body("name").optional().trim().notEmpty().withMessage("O nome da empresa não pode ser vazio."),
  body("description").optional().trim().notEmpty().withMessage("A descrição da empresa não pode ser vazia."),
  body("logo").optional({ nullable: true }).trim().isURL().withMessage("URL do logo inválida."),
  body("coverImage").optional({ nullable: true }).trim().isURL().withMessage("URL da imagem de capa inválida."),
  body("yearEstablished").optional({ nullable: true }).trim().isNumeric().withMessage("Ano de estabelecimento deve ser numérico."),
  body("phone").optional({ nullable: true }).trim().isMobilePhone("pt-BR").withMessage("Número de telefone inválido."),
  body("email").optional({ nullable: true }).trim().isEmail().withMessage("Email da empresa inválido.").normalizeEmail(),
  body("categories").optional().isArray({ min: 1 }).withMessage("A empresa deve ter pelo menos uma categoria."),
  body("categories.*").optional().trim().notEmpty().withMessage("Categoria não pode ser vazia."),
  // Permite atualização parcial do endereço
  body("address.street").optional().trim().notEmpty().withMessage("A rua do endereço é obrigatória."),
  body("address.number").optional().trim().notEmpty().withMessage("O número do endereço é obrigatório."),
  body("address.neighborhood").optional().trim().notEmpty().withMessage("O bairro do endereço é obrigatório."),
  body("address.city").optional().trim().notEmpty().withMessage("A cidade do endereço é obrigatória."),
  body("address.state").optional().trim().notEmpty().withMessage("O estado do endereço é obrigatório.").isLength({ min: 2, max: 2 }).withMessage("O estado deve ter 2 caracteres (UF)."),
  body("address.zipCode").optional().trim().notEmpty().withMessage("O CEP do endereço é obrigatório.").isPostalCode("BR").withMessage("CEP inválido."),
  body("address.complement").optional({ nullable: true }).trim(),
  // Permite atualização parcial dos horários
  body("workingHours").optional({ nullable: true }).isJSON().withMessage("Horários de funcionamento devem estar em formato JSON."),
];

export const companyIdValidator = [
  param("id").isUUID().withMessage("ID da empresa inválido."),
];

