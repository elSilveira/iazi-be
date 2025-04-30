import { Router } from "express";
import { login, register, refreshToken } from "../controllers/authController"; // Importa refreshToken
import { registerValidator, loginValidator } from "../validators/authValidators";
import { validateRequest } from "../middlewares/validationMiddleware";

const router = Router();

// Rota de Registro: aplica o validador e o middleware de validação
router.post("/register", registerValidator, validateRequest, register);

// Rota de Login: aplica o validador e o middleware de validação
router.post("/login", loginValidator, validateRequest, login);

// Rota para Refresh Token (Nova)
router.post("/refresh", refreshToken); // Não precisa de validação específica aqui, o controller verifica o token

export default router;

