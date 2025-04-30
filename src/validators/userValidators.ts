import { body } from "express-validator";

export const updateUserValidator = [
  body("email")
    .optional()
    .isEmail()
    .withMessage("Formato de email inválido.")
    .normalizeEmail(),
  body("name")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Nome não pode ser vazio."),
  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Senha deve ter pelo menos 6 caracteres."),
  body("avatar")
    .optional()
    .isURL()
    .withMessage("URL do avatar inválida."),
];

