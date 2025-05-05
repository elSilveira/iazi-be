import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Retorna apenas a primeira mensagem de erro para simplificar
    const firstError = errors.array({ onlyFirstError: true })[0];
    res.status(400).json({ message: firstError.msg });
    return; // Interrompe a execução se houver erro
  }
  next(); // Prossegue para o próximo middleware/controller se não houver erros
};

