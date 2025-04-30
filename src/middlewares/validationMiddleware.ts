import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

/**
 * Middleware para processar os resultados da validação do express-validator.
 * Se houver erros de validação, retorna uma resposta 400 com os erros.
 * Caso contrário, passa para o próximo middleware.
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => { // Adicionado :void como tipo de retorno explícito
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Retorna apenas a primeira mensagem de erro para simplificar a resposta inicial
    // Pode ser ajustado para retornar todos os erros: errors.array()
    res.status(400).json({ message: "Erro de validação", errors: errors.array() });
    return; // Adicionado return para garantir que a função termine aqui em caso de erro
  }
  next();
};

