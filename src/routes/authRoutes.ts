import { Router } from "express";
import { login, register } from "../controllers/authController";
import { registerValidator, loginValidator } from "../validators/authValidators";
import { validateRequest } from "../middlewares/validationMiddleware";

const router = Router();

// Rota de Registro: aplica o validador e o middleware de validação
router.post("/register", registerValidator, validateRequest, register);

// Rota de Login: aplica o validador e o middleware de validação
router.post("/login", loginValidator, validateRequest, login);

export default router;

