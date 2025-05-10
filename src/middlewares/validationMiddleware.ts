import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Retorna todas as mensagens de erro detalhadas
    const errorDetails = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));
    res.status(400).json({ message: "Erro de validação", errors: errorDetails });
    return;
  }
  next();
};

