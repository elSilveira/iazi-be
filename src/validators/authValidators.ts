import { body } from "express-validator";

export const registerValidator = [
  body("email")
    .trim()
    .notEmpty().withMessage("O email é obrigatório.")
    .isEmail().withMessage("Formato de email inválido.")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 }).withMessage("A senha deve ter no mínimo 6 caracteres."),
  body("name")
    .trim()
    .notEmpty().withMessage("O nome é obrigatório.")
    .isLength({ min: 2 }).withMessage("O nome deve ter no mínimo 2 caracteres."),
  body("avatar")
    .optional()
    .trim()
    .isURL().withMessage("URL do avatar inválida."),
];

export const loginValidator = [
  body("email")
    .trim()
    .notEmpty().withMessage("O email é obrigatório.")
    .isEmail().withMessage("Formato de email inválido.")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("A senha é obrigatória."),
];

